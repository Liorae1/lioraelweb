const STORAGE_KEY = "liorael_user";

export const demoUser = {
  id: 1,
  name: "Yuliia",
  username: "@yuliia",
  email: "yuliia@email.com",
  balance: 12450,
  avatar: "",
  isAuth: true,
  stats: {
    bids: 4,
    favorites: 7,
    purchases: 2,
  },
  activity: [
    {
      id: 1,
      title: "Ставка на Burberry Trench Coat",
      time: "2 години тому",
    },
    {
      id: 2,
      title: "Додано в обране Prada Bag",
      time: "5 годин тому",
    },
    {
      id: 3,
      title: "Переглянуто Gucci Heels",
      time: "Вчора",
    },
  ],
};

export function loginFakeUser(customUser = {}) {
  const user = {
    ...demoUser,
    ...customUser,
    isAuth: true,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("authChanged"));
  return user;
}

export function logoutFakeUser() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("authChanged"));
}

export function getCurrentUser() {
  try {
    const user = localStorage.getItem(STORAGE_KEY);
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  const user = getCurrentUser();
  return !!user?.isAuth;
}