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
export enum Designation {
  JUNIOR = "JUNIOR",
  MID = "MID",
  SENIOR = "SENIOR",
  MANAGER = "MANAGER",
}
export enum Department {
  ENGINEERING = "ENGINEERING",
  HR = "HR",
  MARKETING = "MARKETING",
  SALES = "SALES",
  FINANCE = "FINANCE"
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
  designation: Designation
  accountType: AccountType;
  auths: IAuthProvider[];
  createdAt?: Date;
  updatedAt?: Date;
}
