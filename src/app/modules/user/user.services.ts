
import httpStatus from "http-status-codes";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { AccountStatus, AccountType, IUser, Role } from "./user.interface";
import { User } from "./user.model";
import { userFilterableFields, userSearchableFields } from "./user.constant";
import { QueryBuilder } from "../../utils/QueryBuiler";
import { JwtPayload } from "jsonwebtoken";
import bcryptjs from 'bcryptjs';
import { deleteFileFromS3 } from "../../config/S3Client.config";
import { generateOtp } from "../otp/otp.service";
import { sendEmail } from "../../utils/sendEmail";
import { redisClient } from "../../config/redis.config";
import { getCurrentQuarter } from "../../utils/wallet";
import { Wallet } from "../wallet/wallet.model";
import { SubscriptionStatus } from "../subscription/subscription.interface";

const createUser = async (payload: Partial<IUser>, creatorToken?: JwtPayload) => {
  const { email, password, accountType, department, ...rest } = payload;

  const isUserExist = await User.findOne({ email });
  if (isUserExist) {
    throw new AppError(httpStatus.BAD_REQUEST, "User Already Exist");
  }

  let role = Role.USER;
  let organizationId = null;
  let assignedDepartment = department || "Personal Account";

  // ==========================================
  // 🔥 SUBSCRIPTION & USER LIMIT CHECK
  // ==========================================
  if (creatorToken) {
    if (creatorToken.role === Role.ORGANIZATION_ADMIN) {
      organizationId = creatorToken.userId;
      if (payload.role === Role.DEPARTMENT_ADMIN) {
        role = Role.DEPARTMENT_ADMIN;
      }
    } else if (creatorToken.role === Role.DEPARTMENT_ADMIN) {
      organizationId = creatorToken.organizationId;
      assignedDepartment = creatorToken.department;
      role = Role.USER; 
    }

    // ডাটাবেজ থেকে রুট অর্গানাইজেশন এডমিনের ডাটা প্ল্যান সহ আনবো
    const rootOrgAdmin = await User.findById(organizationId).populate("currentPlan");

    if (!rootOrgAdmin) {
      throw new AppError(httpStatus.NOT_FOUND, "Organization Admin not found");
    }

    // ১. সাবস্ক্রিপশন অ্যাক্টিভ আছে কি না চেক করা
    if (
      rootOrgAdmin.subscriptionStatus !== SubscriptionStatus.ACTIVE &&
      rootOrgAdmin.subscriptionStatus !== SubscriptionStatus.TRIAL
    ) {
      throw new AppError(httpStatus.FORBIDDEN, "Organization subscription is not active. Please upgrade your plan.");
    }

    // ২. প্ল্যান লিমিট চেক করা
    const plan = rootOrgAdmin.currentPlan as any; 
    if (!plan || !plan.userLimit) {
      throw new AppError(httpStatus.BAD_REQUEST, "Active plan details not found");
    }

    // বর্তমান ইউজারের সংখ্যা বের করা (অর্গানাইজেশন এডমিন বাদে)
    const currentUserCount = await User.countDocuments({ 
      organizationId, 
      isDeleted: false 
    });

    if (currentUserCount >= plan.userLimit) {
      throw new AppError(
        httpStatus.FORBIDDEN, 
        `User limit reached! Your plan allows up to ${plan.userLimit} users.`
      );
    }
  }

  // ==========================================
  // 🚀 USER CREATION
  // ==========================================
  const hashedPassword = await bcryptjs.hash(
    password as string,
    Number(envVars.BCRYPT_SALT_ROUND)
  );

  const status =
    accountType === AccountType.ORGANIZATION
      ? AccountStatus.PENDING
      : AccountStatus.APPROVED;

  const user = await User.create({
    email,
    password: hashedPassword,
    accountType: organizationId ? AccountType.INDIVIDUAL : accountType,
    role,
    status,
    department: assignedDepartment,
    organizationId,
    createdBy: creatorToken ? creatorToken.userId : null,
    ...rest,
  });

  if (!user) {
    throw new AppError(httpStatus.BAD_REQUEST, "Failed to register user");
  }

  // অর্গানাইজেশন এডমিন প্রথমবার রেজিস্ট্রেশন করলে ইমেইল যাবে
  if (accountType === AccountType.ORGANIZATION && !creatorToken) {
    await sendEmail({
      to: envVars.EMAIL_SENDER.SMTP_FROM, 
      subject: `New Organization Registration - ${user.name}`,
      templateName: "organizationRequest",
      templateData: {
        applicantName: user.name,
        applicantEmail: user.email,
        department: user.department,
        senderName: "System Notification"
      },
    });
  }

  const { quarter, year } = getCurrentQuarter();

  const wallet = await Wallet.create({
    user: user._id,
    organizationId: user.organizationId || user._id,
    quarter,
    year,
    pointsAllocated: 0,
    pointsBalance: 0
  });

  const redisKey = `otp:${email}`;
  const otp = generateOtp();

  await redisClient.set(redisKey, otp, {
    expiration: { type: "EX", value: 120 },
  });

  await sendEmail({
    to: email,
    subject: "Account Verification OTP",
    templateName: "otp",
    templateData: {
      name: user.name,
      otp,
    },
  });

  return { wallet, user };
};

const getAllUsers = async (
  query: Record<string, string>,
  decodedToken: JwtPayload
) => {
  const filter: any = {};

  // =====================================
  // 🔐 STRICT ROLE BASED DATA ISOLATION
  // =====================================

  // 1. SUPER_ADMIN: সব দেখতে পারবে, তবে চাইলে নির্দিষ্ট organization ফিল্টার করতে পারবে
  if (decodedToken.role === Role.SUPER_ADMIN) {
    if (query.organizationId) {
      filter.organizationId = query.organizationId;
    }
  }

  // 2. ORGANIZATION_ADMIN: শুধুমাত্র নিজের অর্গানাইজেশনের ইউজার এবং DA দেখতে পারবে
  if (decodedToken.role === Role.ORGANIZATION_ADMIN) {
    filter.organizationId = decodedToken.userId; 
  }

  // 3. DEPARTMENT_ADMIN: নিজের অর্গানাইজেশনের এবং শুধুমাত্র নিজের ডিপার্টমেন্টের ইউজারদের দেখতে পারবে
  if (decodedToken.role === Role.DEPARTMENT_ADMIN) {
    filter.organizationId = decodedToken.organizationId;
    filter.department = decodedToken.department;
  }

  // 4. REGULAR USER: নিজের অর্গানাইজেশনের এবং নিজের ডিপার্টমেন্টের অন্য ইউজারদের দেখতে পারবে
  if (decodedToken.role === Role.USER) {
    filter.organizationId = decodedToken.organizationId;
    filter.department = decodedToken.department;
    filter.role = Role.USER; // সাধারণ ইউজারদের Admin দের দেখার দরকার নেই
  }

  const queryBuilder = new QueryBuilder(User.find(filter), query);

  const usersData = queryBuilder
    .filter()
    .search(userSearchableFields)
    .sort()
    .fields()
    .paginate();

  const [data, meta] = await Promise.all([
    usersData.build(),
    usersData.getMeta(),
  ]);

  // --- Wallet Attachment Logic remains exactly the same ---
  const { year, quarter } = getCurrentQuarter();
  const userIds = data.map((user: any) => user._id);

  const wallets = await Wallet.find({
    user: { $in: userIds },
    year,
    quarter,
  });

  const usersWithWallet = data.map((user: any) => {
    const wallet = wallets.find(
      (w: any) => w.user.toString() === user._id.toString()
    );

    return {
      ...user,
      wallet: wallet
        ? {
            pointsBalance: wallet.pointsBalance,
            pointsAllocated: wallet.pointsAllocated,
          }
        : {
            pointsBalance: 0,
            pointsAllocated: 0,
          },
    };
  });

  return { data: usersWithWallet, meta };
};

const approveOrganization = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.accountType !== AccountType.ORGANIZATION) {
    throw new AppError(httpStatus.BAD_REQUEST, "Not an organization account");
  }

  user.status = AccountStatus.APPROVED;
  user.role = Role.ORGANIZATION_ADMIN;

  await user.save();

  return user;
};

const rejectOrganization = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.accountType !== AccountType.ORGANIZATION) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Only organization accounts can be rejected"
    );
  }

  user.status = AccountStatus.REJECTED;
  user.role = Role.USER; // fallback safe role

  await user.save();

  return user;
};



const getMe = async (userId: string) => {
  const user = await User.findById(userId).select("-password");
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const { year, quarter } = getCurrentQuarter();

  const wallet = await Wallet.findOne({
    user: user._id,
    year,
    quarter
  });

  return {
    data: {
      ...user.toObject(),
      wallet: wallet || null
    }
  };
};


const getS3KeyFromUrl = (url: string) => {
  const parts = url.split(`/${envVars.S3.S3_BUCKET_NAME}/`);
  return parts[1] ?? "";
};

const updateMyProfile = async ({
  userId,
  payload,
  decodedToken,
  file,
  oldPassword,
  newPassword,
  confirmPassword,
}: any) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, "User not found");

  // Authorization check
  if (decodedToken.role === "USER" && decodedToken.userId !== userId) {
    throw new AppError(403, "You are not authorized");
  }

  // ===============================
  // 🔐 ONLY ALLOWED FIELDS
  // ===============================
  const allowedFields = ["name", "department", "accountType", "phone"];

  const filteredPayload: any = {};

  Object.keys(payload).forEach((key) => {
    if (allowedFields.includes(key)) {
      filteredPayload[key] = payload[key];
    }
  });

  // ===============================
  // 🔐 PASSWORD UPDATE (SAFE)
  // ===============================
  if (oldPassword || newPassword || confirmPassword) {
    if (!oldPassword || !newPassword || !confirmPassword) {
      throw new AppError(400, "All password fields are required");
    }

    if (newPassword !== confirmPassword) {
      throw new AppError(400, "Passwords do not match");
    }

    const isOldPasswordMatch = await bcryptjs.compare(
      oldPassword,
      user.password as string
    );

    if (!isOldPasswordMatch) {
      throw new AppError(httpStatus.UNAUTHORIZED, "Old password is incorrect");
    }

    filteredPayload.password = await bcryptjs.hash(
      newPassword,
      Number(envVars.BCRYPT_SALT_ROUND || 10)
    );
  }

  // ===============================
  // 🖼️ PROFILE PICTURE UPDATE
  // ===============================
  if (file) {
    if (user.picture) {
      const oldKey = getS3KeyFromUrl(user.picture);
      if (oldKey) await deleteFileFromS3(oldKey);
    }

    filteredPayload.picture = file.location;
  }

  // ===============================
  // 🚀 UPDATE USER
  // ===============================
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    filteredPayload,
    {
      new: true,
      runValidators: true,
    }
  );

  return updatedUser;
};

const deleteOwnAccount = async (userId: string) => {

  const user = await User.findById(userId);
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  await User.findByIdAndDelete(userId);

  return { message: "Your account has been deleted successfully" };
};

const deleteAllUsers = async () => {
  const result = await User.deleteMany({});

  return result;
};

const getSingleUser = async (id: string, decodedToken: JwtPayload) => {
  const user = await User.findById(id).select("-password");
  
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // ==========================================
  // 🔐 CROSS-TENANT DATA ISOLATION (GET)
  // ==========================================
  if (decodedToken.role !== Role.SUPER_ADMIN) {
    // If the target user is an Organization Admin, their _id is the organizationId
    const targetOrgId = user.organizationId?.toString() || user._id.toString();
    const requesterOrgId = decodedToken.role === Role.ORGANIZATION_ADMIN 
      ? decodedToken.userId 
      : decodedToken.organizationId;

    if (targetOrgId !== requesterOrgId) {
      throw new AppError(httpStatus.FORBIDDEN, "Not authorized to view users from another organization");
    }

    if (decodedToken.role === Role.DEPARTMENT_ADMIN || decodedToken.role === Role.USER) {
      if (user.department !== decodedToken.department) {
        throw new AppError(httpStatus.FORBIDDEN, "Not authorized to view users outside your department");
      }
    }
  }

  const { year, quarter } = getCurrentQuarter();
  const wallet = await Wallet.findOne({ user: user._id, year, quarter });

  return {
    data: { ...user.toObject(), wallet: wallet || null }
  };
};

const updateUser = async (
  userId: string,
  payload: Partial<IUser>,
  decodedToken: JwtPayload
) => {
  const targetUser = await User.findById(userId);

  if (!targetUser) {
    throw new AppError(404, "User Not Found");
  }

  // Normal user cannot update others
  if (decodedToken.role === Role.USER) {
    throw new AppError(403, "Not authorized");
  }

  // ==========================================
  // 🔐 CROSS-TENANT DATA ISOLATION (UPDATE)
  // ==========================================
  if (decodedToken.role !== Role.SUPER_ADMIN) {
    if (targetUser.role === Role.SUPER_ADMIN) {
      throw new AppError(403, "Cannot modify Super Admin");
    }

    const targetOrgId = targetUser.organizationId?.toString() || targetUser._id.toString();
    const requesterOrgId = decodedToken.role === Role.ORGANIZATION_ADMIN 
      ? decodedToken.userId 
      : decodedToken.organizationId;

    if (targetOrgId !== requesterOrgId) {
      throw new AppError(403, "Cannot modify users from another organization");
    }

    if (decodedToken.role === Role.DEPARTMENT_ADMIN) {
      if (targetUser.department !== decodedToken.department) {
        throw new AppError(403, "Cannot modify users from another department");
      }
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    payload,
    { new: true, runValidators: true }
  );

  return updatedUser;
};

const deleteUserById = async (
  id: string,
  decodedToken: JwtPayload
) => {
  const user = await User.findById(id);

  if (!user) {
    throw new AppError(404, "User not found");
  }

  // ==========================================
  // 🔐 CROSS-TENANT DATA ISOLATION (DELETE)
  // ==========================================
  if (decodedToken.role !== Role.SUPER_ADMIN) {
    if (user.role === Role.SUPER_ADMIN) {
      throw new AppError(403, "Cannot delete Super Admin");
    }

    const targetOrgId = user.organizationId?.toString() || user._id.toString();
    const requesterOrgId = decodedToken.role === Role.ORGANIZATION_ADMIN 
      ? decodedToken.userId 
      : decodedToken.organizationId;

    if (targetOrgId !== requesterOrgId) {
      throw new AppError(403, "Cannot delete users from another organization");
    }

    if (decodedToken.role === Role.DEPARTMENT_ADMIN) {
      if (user.department !== decodedToken.department) {
        throw new AppError(403, "Cannot delete users from another department");
      }
    }
  }

  await User.findByIdAndDelete(id);

  return user;
};

export const UserServices = {
  createUser,
  approveOrganization,
  rejectOrganization,
  getAllUsers,
  getMe,
  getSingleUser,
  updateUser,
  updateMyProfile,
  deleteOwnAccount,
  deleteUserById,
  deleteAllUsers
};
