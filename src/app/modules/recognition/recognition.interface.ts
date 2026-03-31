// import { CategoryName } from "../category/category.interface"
// import { Department } from "../user/user.interface"

export enum RecognitionStatus {
   FAILED = "FAILED",
   PENDING = "PENDING",
   SENT = "SENT"
}

// export enum RecognitionValues {
//   EXCEEDING_EXPECTATION = "EXCEEDING_EXPECTATION",
//   RESULT_DRIVER = "RESULT_DRIVER",
//   QUALITY_CHAMPION = "QUALITY_CHAMPION",
//   OPERATIONAL_EXCELLENCE = "OPERATIONAL_EXCELLENCE",
//   ACCOUNTABILITY_AND_OWNERSHIP = "ACCOUNTABILITY_AND_OWNERSHIP",
//   DEPENDABILITY = "DEPENDABILITY",
//   INNOVATION_CATALYST = "INNOVATION_CATALYST",
//   CREATIVE_THINKING = "CREATIVE_THINKING",
//   PROBLEM_SOLVER = "PROBLEM_SOLVER",
//   ADAPTABILITY = "ADAPTABILITY",
//   TEAM_PLAYER = "TEAM_PLAYER",
//   CROSS_TEAM_COLLABORATOR = "CROSS_TEAM_COLLABORATOR",
//   SUPPORTIVE_PEER = "SUPPORTIVE_PEER",
//   POSITIVITY_CHAMPION = "POSITIVITY_CHAMPION",
//   EMPOWERING_LEADER = "EMPOWERING_LEADER",
//   INSPIRING_MENTOR = "INSPIRING_MENTOR",
//   RISING_STAR = "RISING_STAR",
//   ROLE_MODEL = "ROLE_MODEL",
//   INTEGRITY_IN_ACTION = "INTEGRITY_IN_ACTION",
//   CUSTOMER_CHAMPION = "CUSTOMER_CHAMPION"
// }

// export enum Tone {
//   PROFESSIONAL_AND_POLISHED = "PROFESSIONAL_AND_POLISHED",
//   WARM_AND_HEARTFELT = "WARM_AND_HEARTFELT",
//   ENERGETIC_AND_HYPE = "ENERGETIC_AND_HYPE",
//   APPRECIATIVE_SHORT_AND_SWEET = "APPRECIATIVE_SHORT_AND_SWEET",
//   WITTY_AND_FUN = "WITTY_AND_FUN",
// }


export interface IRecognition {
  senderEmail: string
  receiverEmail: string

  image:string
  department: string
  category: string
  // department: Department
  // category: CategoryName
  tone: string
  recognition_values: string[]
  // tone: Tone
  // value: RecognitionValues

  points: number
  message: string
  additionalMessage?: string

  status: RecognitionStatus

  createdAt?: Date
  updatedAt?: Date
}