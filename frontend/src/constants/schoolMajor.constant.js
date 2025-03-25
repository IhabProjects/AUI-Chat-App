// Define the main data structure for schools and their corresponding majors
export const SCHOOL_MAJORS = {
  SSE: {
    name: "School of Science and Engineering (SSE)",
    majors: [
      "Computer Science",
      "General Engineering",
      "Engineering and Management Science",
    ],
  },
  SHSS: {
    name: "School of Humanities and Social Sciences (SHSS)",
    majors: [
      "International Studies",
      "Communication Studies",
      "Human Resource Development",
      "North African and Middle Eastern Studies",
      "International Studies and Diplomacy",
    ],
  },
  BA: {
    name: "School of Business Administration (BA)",
    majors: [
      "Business Administration",
      "International Trade",
      "Sustainable Energy Management",
    ],
  },
};

// Helper functions that can be reused across components

/**
 * Finds the school code (SSE, SHSS, BA) for a given major name
 * @param {string} majorName - The name of the major to search for
 * @returns {string} The school code or empty string if not found
 */
export const findSchoolForMajor = (majorName) => {
  return Object.entries(SCHOOL_MAJORS).find(([_, schoolData]) =>
    schoolData.majors.includes(majorName)
  )?.[0] || "";
};

/**
 * Returns a flat array of all available majors across all schools
 * @returns {string[]} Array of all major names
 */
export const getAllMajors = () => {
  return Object.values(SCHOOL_MAJORS).flatMap((school) => school.majors);
};

/**
 * Gets the list of majors available for a specific school
 * @param {string} schoolCode - The school code (SSE, SHSS, BA)
 * @returns {string[]} Array of major names for the school, or empty array if school not found
 */
export const getMajorsForSchool = (schoolCode) => {
  return SCHOOL_MAJORS[schoolCode]?.majors || [];
};
