import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { api } from "../lib/api.js";


const AuthContext = createContext(null);


export function AuthProvider({ children }) {

  const [user, setUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);


    //  CHECK LOGIN ON APP LOAD


  useEffect(() => {

    const token =
      localStorage.getItem("3w_token");


    if (!token) {

      setLoading(false);

      return;
    }


    api
      .get("/auth/me")

      .then((res) => {

        setUser(
          res.data?.user || null
        );

      })

      .catch((error) => {

        console.error(
          "AUTH CHECK ERROR:",
          error
        );

        localStorage.removeItem(
          "3w_token"
        );

        setUser(null);

      })

      .finally(() => {

        setLoading(false);

      });

  }, []);



  useEffect(() => {

    function handleLogout() {

      localStorage.removeItem(
        "3w_token"
      );

      setUser(null);

    }


    window.addEventListener(
      "auth:logout",
      handleLogout
    );


    return () => {

      window.removeEventListener(
        "auth:logout",
        handleLogout
      );

    };

  }, []);



    //  LOGIN


  async function login(
    email,
    password
  ) {

    const cleanEmail =
      String(email || "")
        .trim()
        .toLowerCase();


    const res =
      await api.post(
        "/auth/login",
        {
          email: cleanEmail,
          password,
        }
      );


    const token =
      res.data?.token;

    const loggedInUser =
      res.data?.user;


    if (!token || !loggedInUser) {

      throw new Error(
        "Invalid login response."
      );

    }


    localStorage.setItem(
      "3w_token",
      token
    );


    setUser(loggedInUser);


    return res.data;
  }



    //  SIGNUP


  async function signup(
    username,
    email,
    password
  ) {

    const cleanUsername =
      String(username || "")
        .trim();

    const cleanEmail =
      String(email || "")
        .trim()
        .toLowerCase();


    const res =
      await api.post(
        "/auth/signup",
        {
          username: cleanUsername,
          email: cleanEmail,
          password,
        }
      );


    const token =
      res.data?.token;

    const newUser =
      res.data?.user;


    if (!token || !newUser) {

      throw new Error(
        "Invalid signup response."
      );

    }


    localStorage.setItem(
      "3w_token",
      token
    );


    setUser(newUser);


    return res.data;
  }



    //  LOGOUT


  function logout() {

    localStorage.removeItem(
      "3w_token"
    );

    setUser(null);

  }



  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {

  return useContext(
    AuthContext
  );

}