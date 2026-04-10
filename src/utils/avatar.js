export const getAvatarPlaceholder = (
  firstName,
  lastName,
  email,
  size = 120
) => {
  const name =
    firstName && lastName
      ? `${firstName} ${lastName}`
      : email
      ? email.split('@')[0]
      : 'User';

  return `https://ui-avatars.com/api/?background=0D8F81&color=fff&rounded=true&size=${size}&bold=true&name=${encodeURIComponent(name)}`;
};