export const publicationAccessStep = ({ sessionToken = "", groupCode = "" } = {}) => {
  if (sessionToken) return "composer";
  if (groupCode) return "profile-setup";
  return "password";
};

export const publicationEntryState = ({
  sessionToken = "",
  groupCode = "",
  selectedDay = -1,
} = {}) => ({
  composeOpen: true,
  selectedDay,
  step: publicationAccessStep({ sessionToken, groupCode }),
});
