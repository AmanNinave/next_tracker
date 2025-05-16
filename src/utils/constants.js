
export const statuses = ["pending", "inprogress", "completed", "scheduled", "cancelled", "recurring", "missed"];
  
export const categories_and_subcategories = {
    Routine: [
    "Sleep",      // Sleep (e.g., night sleep, power nap, etc.)
    "Meals",      // Meals (e.g., breakfast, lunch, dinner)
    "Exercise",   // Physical activity (e.g., gym, yoga, etc.)
    "Hygiene",    // Personal care ( e.g., showering, brushing teeth, Toilet breaks, etc.)
    ],
    Break: [
        "Unnecessary", // Optional breaks (e.g., Break which can be skipped)
        "Short", // Short breaks (e.g., coffee break, quick walk, etc.)
        "Long",  // Longer breaks (e.g., lunch break, extended rest, etc.)
        "Social", // Social breaks (e.g., chatting with friends, etc.)
        "Rest", // Rest breaks (e.g., power naps, relaxation, etc.)
        "Mindfulness", // Mindfulness breaks (e.g., meditation, deep breathing, etc.)
        "Digital Detox", // Digital detox breaks (e.g., no screens, etc.)
        "Miscellaneous", // Miscellaneous breaks (e.g., any other type of break)
    ],
    Study: [
        "Frontend",
        "Backend",
        "Fullstack",
        "Projects",
        "DevOps",
        "System Design",
        "DSA",
        "Research",
        "Miscellaneous",
    ],
    Work: [
        "Meetings",
        "Project Work",
        "Emails",
        "Follow-ups",
        "Reports",
        "Miscellaneous",
    ],
    Home: [
        "Home Maintenance",
        "Grocery Shopping",
        "Home Repairs",
        "Cleaning",
        "Cooking",
        "Laundry",
        "Miscellaneous",
    ],
    Personal: [
        "Family Time",
        "Self-Care",
        "Hobbies",
        "Socializing",
        "Volunteering",
        "Miscellaneous",
    ],
    Finance: [
        "Budgeting",
        "Investing",
        "Bill Payments",
        "Money Transfer",
        "Savings",
        "Financial Planning",
        "Miscellaneous",
    ],
    Entertainment: [
        "YouTube",
        "LinkedIn",
        "Music",
        "Miscellaneous",
    ],
    Health: [
        "Doctor's Appointments",
        "Medication",
        "Miscellaneous",
    ],
    Shopping: [
        "Groceries",
        "Clothing",
        "Electronics",
        "Home Goods",
        "Gifts",
        "Miscellaneous",
    ],
    Travel: [
        "Planning",    // Planning the trip (e.g., itinerary, budget, etc.)
        "Packing",     // Packing for the trip (e.g., clothes, essentials, etc.)
        "Travelling",  // Actual travel time (e.g., flight, train, etc.)
        "Accommodation",  // Booking hotels, etc.
        "Miscellaneous",  // Any other travel-related tasks.
    ],
    Other: [
        "Miscellaneous",  // Any other tasks that don't fit into the above categories.
    ]
}


