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

export enum AccountStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
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
  Sales = "Sales",
  Marketing = "Marketing",
  FinanceAndAccounting = "Finance & Accounting",
  Operations = "Operations",
  HumanResources = "Human Resources (HR)",
  InformationTechnology = "Information Technology (IT)",
  CustomerService = "Customer Service",
  ResearchAndDevelopment = "Research & Development (R&D)",
  LegalRiskAndCompliance = "Legal, Risk & Compliance",
  Administration = "Administration"
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
  department: string; 
  accountType: AccountType;
  status: AccountStatus;
  auths: IAuthProvider[];
  createdAt?: Date;
  updatedAt?: Date;
}
