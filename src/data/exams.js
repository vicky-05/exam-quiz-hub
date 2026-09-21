import rrbLogo from "../assets/exam-logos/rrb.webp";
import tnpscLogo from "../assets/exam-logos/tnpsc.webp";
import sscLogo from "../assets/exam-logos/ssc.png";
import bankingLogo from "../assets/exam-logos/bank.webp";
import ibpsAfoLogo from "../assets/exam-logos/bank.webp";

export const exams = [
  {
    id: "tnpsc",
    name: "TNPSC",
    fullName: "Tamil Nadu Public Service Commission",
    description: "Practice tests, PYQs and mock exams for TNPSC.",
    icon: "TN",
    availability: "Practice available",
    categories: "Group & service exams",
    logo: tnpscLogo,
    dashboardDescription:
      "Build a steady TNPSC preparation routine with focused subject practice, daily quizzes and exam-style tests.",
    stats: [
      { value: "1,200+", label: "Practice questions" },
      { value: "48", label: "Topic-wise tests" },
      { value: "24", label: "Mock tests" },
    ],
    tracks: [
      {
        id: "group-1",
        name: "Group 1",
        description: "Leadership and senior administrative services",
      },
      {
        id: "group-2",
        name: "Group 2",
        description: "State-level administrative services",
      },
      {
        id: "group-4",
        name: "Group 4",
        description: "Village and junior assistant services",
      },
      {
        id: "vao",
        name: "VAO",
        description: "Village Administrative Officer preparation",
      },
      {
        id: "aao",
        name: "AAO",
        description: "Agriculture Assistant Officer examination preparation.",
      },
    ],
  },
  {
    id: "rrb",
    name: "RRB",
    fullName: "Railway Recruitment Board",
    description: "Prepare for NTPC, Group D, ALP and other RRB exams.",
    icon: "RR",
    logo: rrbLogo,
    availability: "Practice available",
    categories: "Railway exam categories",
    dashboardDescription:
      "Prepare for RRB NTPC, Group D, ALP and more with focused practice designed for every stage of your railway exam journey.",
    stats: [
      { value: "2,400+", label: "Practice questions" },
      { value: "86", label: "Topic-wise tests" },
      { value: "32", label: "Mock tests" },
    ],
    tracks: [
      {
        id: "ntpc",
        name: "RRB NTPC",
        description: "Non-technical popular categories",
      },
      {
        id: "rpf",
        name: "RPF",
        description: "Railway Protection Force recruitment",
      },
      {
        id: "group-d",
        name: "RRB Group D",
        description: "Level 1 railway recruitment",
      },
      {
        id: "alp",
        name: "RRB ALP",
        description: "Assistant Loco Pilot recruitment",
      },
    ],
  },
  {
    id: "ssc",
    name: "SSC",
    fullName: "Staff Selection Commission",
    description: "Practice SSC subjects, PYQs and mock tests.",
    icon: "SC",
    logo: sscLogo,
    availability: "Practice available",
    categories: "Central government exams",
    dashboardDescription:
      "Make every study session count with structured SSC practice, PYQs and timed mock tests for your target post.",
    stats: [
      { value: "1,800+", label: "Practice questions" },
      { value: "64", label: "Topic-wise tests" },
      { value: "28", label: "Mock tests" },
    ],
    tracks: [
      { id: "cgl", name: "SSC CGL", description: "Combined Graduate Level" },
      {
        id: "chsl",
        name: "SSC CHSL",
        description: "Combined Higher Secondary Level",
      },
      { id: "mts", name: "SSC MTS", description: "Multi-Tasking Staff" },
      { id: "gd", name: "SSC GD", description: "General Duty recruitment" },
    ],
  },
  
  {
    id: "ibps-afo",
    name: "IBPS AFO",
    fullName: "IBPS Agriculture Field Officer",
    description:
      "Prepare for the IBPS Agriculture Field Officer examination with focused agriculture practice, previous year questions and mock tests.",
    icon: "AF",
    logo: ibpsAfoLogo,
    availability: "Practice available",
    categories: "Agriculture Officer examination",
    dashboardDescription:
      "Build strong preparation for IBPS AFO with structured agriculture subject tests, practice sets and exam-style mock tests.",
    stats: [
      { value: "1,000+", label: "Practice questions" },
      { value: "10+", label: "Agriculture subjects" },
      { value: "20+", label: "Mock tests" },
    ],
    tracks: [
      {
        id: "afo",
        name: "Agriculture Field Officer",
        description: "IBPS Agriculture Field Officer examination preparation",
      },
    ],
  },
];
