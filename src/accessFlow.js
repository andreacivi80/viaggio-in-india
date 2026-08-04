export const publicationAccessStep = ({ sessionToken = "", groupCode = "" } = {}) => {
  if (sessionToken) return "composer";
  if (groupCode) return "personal-link";
  return "password";
};

export const publicationEntryState = ({
  sessionToken = "",
  groupCode = "",
  selectedDay = -1,
} = {}) => ({
  publicPreview: false,
  composeOpen: true,
  selectedDay,
  step: publicationAccessStep({ sessionToken, groupCode }),
});
