import { Types } from "mongoose";

export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  USER = "USER",
}

export enum AccountType {
  ORGANIZATION = "ORGANIZATION",
  INDIVIDUAL = "INDIVIDUAL"
}

export interface IAuthProvider {
  provider: "google" | "credentials";
  providerId: string;
}

export enum IsActive {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  BLOCKED = "BLOCKED",
}
export enum Department {
  SALES = "SALES",
  MARKETING = "MARKETING",
  FINANCE_AND_MARKETING = "FINANCE_AND_MARKETING",
  OPERATIONS = "OPERATIONS",
  HR = "HR",
  IT = "IT",
  CUSTOMER_SERVICE = "CUSTOMER_SERVICE",
  RESEARCH_AND_DEVELOPEMENT = "RESEARCH_AND_DEVELOPEMENT",
  LEGAL_RISK_COMPLIANCE = "LEGAL_RISK_COMPLIANCE",
  ADMINISTRATION = "ADMINISTRATION"
}

export interface IUser {
  _id?: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  picture?: string;
  isDeleted?: boolean;
  isActive?: IsActive;
  isVerified?: boolean;
  role: Role;
  department: Department; 
  accountType: AccountType;
  auths: IAuthProvider[];
  createdAt?: Date;
  updatedAt?: Date;
}
