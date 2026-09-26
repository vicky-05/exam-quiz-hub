import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { supabase } from "../services/supabase";

const AuthContext = createContext(null);

const DEVICE_ID_KEY = "exam_quiz_hub_device_id";
const APP_SESSION_ID_KEY = "exam_quiz_hub_session_id";

const SESSION_HEARTBEAT_MS = 60 * 1000;

/* =========================================================
   DEVICE ID
   One device/browser gets one persistent device ID.
========================================================= */

function getOrCreateDeviceId() {
  try {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);

    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }

    return deviceId;
  } catch (error) {
    console.error("Unable to create device ID:", error);

    return `device-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`;
  }
}

/* =========================================================
   APPLICATION SESSION ID
   This is different from the Supabase access token.
   It remains stable during this browser tab/session.
========================================================= */

function getOrCreateAppSessionId() {
  try {
    let sessionId = sessionStorage.getItem(
      APP_SESSION_ID_KEY
    );

    if (!sessionId) {
      sessionId = crypto.randomUUID();

      sessionStorage.setItem(
        APP_SESSION_ID_KEY,
        sessionId
      );
    }

    return sessionId;
  } catch (error) {
    console.error(
      "Unable to create application session ID:",
      error
    );

    return `session-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`;
  }
}

/* =========================================================
   CLEAR APPLICATION SESSION ID
========================================================= */

function clearStoredAppSessionId() {
  try {
    sessionStorage.removeItem(APP_SESSION_ID_KEY);
  } catch (error) {
    console.warn(
      "Unable to clear application session ID:",
      error
    );
  }
}

/* =========================================================
   DEVICE TYPE
========================================================= */

function getDeviceType() {
  const width = window.innerWidth;

  if (width <= 767) {
    return "mobile";
  }

  if (width <= 1024) {
    return "tablet";
  }

  return "desktop";
}

/* =========================================================
   BROWSER
========================================================= */

function getBrowserName() {
  const userAgent = navigator.userAgent;

  if (/Edg\//i.test(userAgent)) {
    return "Microsoft Edge";
  }

  if (/OPR\//i.test(userAgent)) {
    return "Opera";
  }

  if (
    /Chrome\//i.test(userAgent) &&
    !/Edg\//i.test(userAgent)
  ) {
    return "Google Chrome";
  }

  if (/Firefox\//i.test(userAgent)) {
    return "Mozilla Firefox";
  }

  if (
    /Safari\//i.test(userAgent) &&
    !/Chrome\//i.test(userAgent)
  ) {
    return "Safari";
  }

  return "Unknown Browser";
}

/* =========================================================
   OPERATING SYSTEM
========================================================= */

function getOperatingSystem() {
  const userAgent = navigator.userAgent;

  if (/Windows NT/i.test(userAgent)) {
    return "Windows";
  }

  if (/Android/i.test(userAgent)) {
    return "Android";
  }

  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    return "iOS";
  }

  if (/Mac OS X/i.test(userAgent)) {
    return "macOS";
  }

  if (/Linux/i.test(userAgent)) {
    return "Linux";
  }

  return "Unknown OS";
}

/* =========================================================
   DEVICE NAME
========================================================= */

function getDeviceName() {
  return `${getBrowserName()} on ${getOperatingSystem()}`;
}

/* =========================================================
   AUTH PROVIDER
========================================================= */

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [sessionRowId, setSessionRowId] = useState(null);
  const [sessionError, setSessionError] = useState("");

  const heartbeatTimerRef = useRef(null);
  const sessionRowIdRef = useRef(null);

  const deviceIdRef = useRef(null);
  const appSessionIdRef = useRef(null);

  const signingOutRef = useRef(false);

  /* =========================================================
     INITIALIZE DEVICE / APP SESSION
  ========================================================== */

  useEffect(() => {
    deviceIdRef.current = getOrCreateDeviceId();
    appSessionIdRef.current = getOrCreateAppSessionId();
  }, []);

  /* =========================================================
     LOAD PROFILE
  ========================================================== */

  const loadProfile = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error loading profile:", error);

      setProfile(null);

      return null;
    }

    setProfile(data);

    return data;
  }, []);

  /* =========================================================
     CLEAR HEARTBEAT
  ========================================================== */

  const clearSessionHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);

      heartbeatTimerRef.current = null;
    }
  }, []);

  /* =========================================================
     HEARTBEAT
  ========================================================== */

  const heartbeat = useCallback(async () => {
    const rowId = sessionRowIdRef.current;
    const appSessionId = appSessionIdRef.current;

    if (!rowId || !appSessionId) {
      return;
    }

    const { data, error } = await supabase.rpc(
      "heartbeat_user_session",
      {
        p_session_row_id: rowId,
        p_session_id: appSessionId,
      }
    );

    if (error) {
      console.error(
        "Session heartbeat failed:",
        error
      );

      return;
    }

    /*
     * false means this application session
     * is no longer valid/revoked.
     */

    if (data === false) {
      console.warn(
        "Current application session is no longer valid."
      );

      clearSessionHeartbeat();

      sessionRowIdRef.current = null;

      setSessionRowId(null);

      if (!signingOutRef.current) {
        signingOutRef.current = true;

        try {
          await supabase.auth.signOut();

          clearStoredAppSessionId();

          appSessionIdRef.current = null;

          setUser(null);
          setProfile(null);

          setSessionError(
            "Your session is no longer active. Please sign in again."
          );
        } finally {
          signingOutRef.current = false;
        }
      }
    }
  }, [clearSessionHeartbeat]);

  /* =========================================================
     START HEARTBEAT
  ========================================================== */

  const startSessionHeartbeat = useCallback(
    (rowId) => {
      clearSessionHeartbeat();

      sessionRowIdRef.current = rowId;

      setSessionRowId(rowId);

      heartbeatTimerRef.current = setInterval(() => {
        heartbeat();
      }, SESSION_HEARTBEAT_MS);
    },
    [clearSessionHeartbeat, heartbeat]
  );

  /* =========================================================
     REGISTER APPLICATION SESSION
  ========================================================== */

  const registerApplicationSession = useCallback(
    async (currentUser) => {
      if (!currentUser?.id) {
        throw new Error("You must be signed in.");
      }

      if (!deviceIdRef.current) {
        deviceIdRef.current = getOrCreateDeviceId();
      }

      if (!appSessionIdRef.current) {
        appSessionIdRef.current =
          getOrCreateAppSessionId();
      }

      setSessionError("");

      const { data, error } = await supabase.rpc(
        "create_user_session",
        {
          p_session_id: appSessionIdRef.current,
          p_device_id: deviceIdRef.current,
          p_device_type: getDeviceType(),
          p_browser: getBrowserName(),
          p_operating_system: getOperatingSystem(),
          p_device_name: getDeviceName(),
        }
      );

      if (error) {
        console.error(
          "Application session registration failed:",
          error
        );

        /*
         * PostgreSQL/Supabase may expose the function exception
         * through message, details, hint, or code.
         */
        const errorMessage = [
          error?.message,
          error?.details,
          error?.hint,
          error?.code,
        ]
          .filter(Boolean)
          .join(" ");

        /*
         * The database explicitly blocks the third device with
         * DEVICE_LIMIT_REACHED.
         */
        if (
          errorMessage.includes(
            "DEVICE_LIMIT_REACHED"
          )
        ) {
          setSessionError(
            "DEVICE_LIMIT_REACHED"
          );

          /*
           * Keep the temporary Supabase Auth session alive so
           * LoginPage can show the two active devices and let
           * the user revoke one of them.
           */
          const {
            data: activeDevices,
            error: activeDevicesError,
          } = await supabase
            .from("user_sessions")
            .select(
              "id, session_id, device_id, device_type, browser, operating_system, device_name, last_active_at, created_at"
            )
            .eq("user_id", currentUser.id)
            .is("revoked_at", null)
            .order("last_active_at", {
              ascending: false,
            });

          if (activeDevicesError) {
            console.warn(
              "Unable to load active devices:",
              activeDevicesError
            );
          }

          clearSessionHeartbeat();
          sessionRowIdRef.current = null;
          setSessionRowId(null);

          const limitError = new Error(
            "DEVICE_LIMIT_REACHED"
          );

          limitError.activeDevices =
            activeDevices || [];

          throw limitError;
        }

        /*
         * Any other RPC error also cancels the temporary Auth login.
         */
        try {
          await supabase.auth.signOut();
        } catch (signOutError) {
          console.warn(
            "Unable to sign out after application session error:",
            signOutError
          );
        }

        clearSessionHeartbeat();
        sessionRowIdRef.current = null;
        setSessionRowId(null);
        setUser(null);
        setProfile(null);

        throw error;
      }

      /*
       * Normally create_user_session() returns:
       * { session_row_id: "uuid", ... }
       *
       * Handle object, JSON-string, and array responses.
       */
      let sessionData = data;

      if (typeof sessionData === "string") {
        try {
          sessionData = JSON.parse(sessionData);
        } catch {
          // Leave the original response unchanged.
        }
      }

      let rowId =
        sessionData?.session_row_id ||
        (Array.isArray(sessionData)
          ? sessionData[0]?.session_row_id
          : null);

      /*
       * IMPORTANT:
       * If the RPC succeeded but Supabase returned the JSONB
       * response in an unexpected shape, recover the actual
       * user_sessions row directly using the session_id.
       *
       * This prevents a valid first-device login from being
       * rejected merely because of RPC response formatting.
       */
      if (!rowId) {
        const {
          data: sessionRow,
          error: sessionLookupError,
        } = await supabase
          .from("user_sessions")
          .select("id")
          .eq("user_id", currentUser.id)
          .eq(
            "session_id",
            appSessionIdRef.current
          )
          .is("revoked_at", null)
          .maybeSingle();

        if (sessionLookupError) {
          console.error(
            "Unable to recover application session row:",
            sessionLookupError
          );
        }

        rowId = sessionRow?.id || null;
      }

      if (!rowId) {
        console.error(
          "create_user_session returned an unexpected response:",
          {
            rawData: data,
            parsedData: sessionData,
            userId: currentUser.id,
            appSessionId:
              appSessionIdRef.current,
          }
        );

        try {
          await supabase.auth.signOut();
        } catch (signOutError) {
          console.warn(
            "Unable to sign out after invalid application session response:",
            signOutError
          );
        }

        clearSessionHeartbeat();
        sessionRowIdRef.current = null;
        setSessionRowId(null);
        setUser(null);
        setProfile(null);

        throw new Error(
          "Unable to create your application session. Please try again."
        );
      }

      startSessionHeartbeat(rowId);

      return {
        ...(typeof sessionData === "object" &&
        sessionData !== null &&
        !Array.isArray(sessionData)
          ? sessionData
          : {}),
        session_row_id: rowId,
      };
    },
    [startSessionHeartbeat]
  );

  /* =========================================================
     INITIAL SESSION
  ========================================================== */

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) {
          return;
        }

        const currentUser =
          session?.user ?? null;

        setUser(currentUser);

        if (!currentUser) {
          setProfile(null);
          setLoading(false);

          return;
        }

        const loadedProfile =
          await loadProfile(currentUser.id);

        if (!mounted) {
          return;
        }

        /*
         * Existing authenticated users need their
         * application session restored after page refresh.
         */

        if (
          loadedProfile?.status ===
          "approved"
        ) {
          try {
            await registerApplicationSession(
              currentUser
            );
          } catch (error) {
            console.error(
              "Unable to restore application session:",
              error
            );
          }
        }

        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error(
          "Initial authentication loading failed:",
          error
        );

        if (mounted) {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    }

    loadSession();

    return () => {
      mounted = false;
    };
  }, [
    loadProfile,
    registerApplicationSession,
  ]);

  /* =========================================================
     AUTH STATE CHANGES
  ========================================================== */

  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) {
          return;
        }

        /*
         * Do not perform database calls directly inside
         * onAuthStateChange.
         *
         * Supabase recommends keeping the callback itself
         * synchronous and scheduling other work afterward.
         */

        setTimeout(async () => {
          if (!mounted) {
            return;
          }

          const currentUser =
            session?.user ?? null;

          if (event === "SIGNED_OUT") {
            clearSessionHeartbeat();

            sessionRowIdRef.current = null;

            setUser(null);
            setProfile(null);
            setSessionRowId(null);

            return;
          }

          if (
            event === "SIGNED_IN" ||
            event === "INITIAL_SESSION"
          ) {
            setUser(currentUser);

            if (!currentUser) {
              setProfile(null);

              return;
            }

            const loadedProfile =
              await loadProfile(
                currentUser.id
              );

            if (!mounted) {
              return;
            }

            /*
             * LoginPage handles application-session
             * registration immediately after checking
             * the account approval status.
             *
             * Therefore we don't register again here.
             */

            if (
              loadedProfile?.status ===
              "approved"
            ) {
              return;
            }
          }
        }, 0);
      }
    );

    return () => {
      mounted = false;

      subscription.unsubscribe();
    };
  }, [
    clearSessionHeartbeat,
    loadProfile,
  ]);

  /* =========================================================
     SIGN OUT
  ========================================================== */

  const signOut = useCallback(async () => {
    try {
      signingOutRef.current = true;

      clearSessionHeartbeat();

      const appSessionId =
        appSessionIdRef.current;

      if (appSessionId) {
        try {
          await supabase.rpc(
            "revoke_current_user_session",
            {
              p_session_id: appSessionId,
            }
          );
        } catch (error) {
          console.warn(
            "Unable to revoke application session:",
            error
          );
        }
      }

      const { error } =
        await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      sessionRowIdRef.current = null;

      setSessionRowId(null);
      setUser(null);
      setProfile(null);
      setSessionError("");

      /*
       * Generate a fresh application session ID
       * next time this browser logs in.
       *
       * This prevents the unique(user_id, session_id)
       * database constraint from being hit after logout.
       */

      clearStoredAppSessionId();

      appSessionIdRef.current = null;
    } finally {
      signingOutRef.current = false;
    }
  }, [clearSessionHeartbeat]);

  /* =========================================================
     CLEANUP
  ========================================================== */

  useEffect(() => {
    return () => {
      clearSessionHeartbeat();
    };
  }, [clearSessionHeartbeat]);

  /* =========================================================
     CONTEXT
  ========================================================== */

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,

        sessionRowId,
        sessionError,
        deviceId: deviceIdRef.current,

        registerApplicationSession,

        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* =========================================================
   USE AUTH
========================================================= */

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}