// About page copy. Placeholder text — edit freely; the page layout reads everything from here.

export type AboutFeature = {
  key: "directory" | "search" | "profiles" | "feed" | "myProfile";
  title: string;
  description: string;
};

export const aboutContent = {
  title: "About the Alumni Details System",
  intro:
    "A place for our graduates to stay connected, share what they're working on, and help the next generation of students.",

  whatItIs: {
    title: "What it is",
    body:
      "The Alumni Details System is an online community for our institution's alumni. It brings together an alumni directory, personal profiles and a shared feed, so it's easy to find people and keep in touch after graduation.",
  },

  purpose: {
    title: "Purpose",
    body:
      "We want to keep graduates connected to each other and to the institution: to make mentoring and networking easier, to celebrate alumni achievements, and to give current students a way to learn from those who came before them.",
  },

  features: {
    title: "Features",
    items: [
      {
        key: "directory",
        title: "Alumni directory",
        description: "Browse alumni by name, role, company, department and graduation year.",
      },
      {
        key: "search",
        title: "Search and filters",
        description: "Quickly narrow the directory down to the people you're looking for.",
      },
      {
        key: "profiles",
        title: "Alumni profiles",
        description: "See someone's background, current role, bio, experience and posts.",
      },
      {
        key: "feed",
        title: "Community feed",
        description: "Share updates, news and opportunities with the whole community.",
      },
      {
        key: "myProfile",
        title: "Your own profile",
        description: "Keep your details up to date so others can find and reach you.",
      },
    ] satisfies AboutFeature[],
  },

  whoCanJoin: {
    title: "Who can join",
    body:
      "Graduates of the institution can create an alumni account from the sign-up page. Student and administrator accounts are set up by the system administrators.",
  },

  contact: {
    title: "Contact",
    body: "Questions, corrections or ideas? Get in touch with the alumni office:",
    // Replace with a real address; it becomes a mailto link automatically.
    email: "[your email]",
  },
};
