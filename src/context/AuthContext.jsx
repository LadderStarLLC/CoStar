"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    GoogleAuthProvider,
    GithubAuthProvider,
    signInWithPopup,
    signInWithCustomToken,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import {
    doc,
    getDoc,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import {
    createOrSyncUserProfileFromAuth,
    isAccountType,
} from '@/lib/profile';
import { continueDeletedProviderReactivation } from '@/lib/providerReactivation';

const REQUESTED_ACCOUNT_TYPE_KEY = 'costar:requestedAccountType';
const REACTIVATION_TOKEN_KEY = 'costar:reactivationToken';

function getDeletedAccountMessage(requestedType) {
    return requestedType
        ? "Deleted accounts can choose a new Talent, Employer, or Agency path after confirming ownership. Use the same sign-in method and password to continue."
        : "This LadderStar account was deleted. To recreate it, choose Sign up, select a profile type, and use the same sign-in method.";
}

function storeSignupIntent(requestedType, reactivationToken = null) {
    if (requestedType && isAccountType(requestedType)) {
        window.sessionStorage.setItem(REQUESTED_ACCOUNT_TYPE_KEY, requestedType);
    }
    if (reactivationToken) {
        window.sessionStorage.setItem(REACTIVATION_TOKEN_KEY, reactivationToken);
    }
}

function clearSignupIntent() {
    window.sessionStorage.removeItem(REQUESTED_ACCOUNT_TYPE_KEY);
    window.sessionStorage.removeItem(REACTIVATION_TOKEN_KEY);
}

async function bootstrapAccount(currentUser, requestedType, reactivationToken = null) {
    const token = await currentUser.getIdToken();
    const response = await fetch('/api/account/bootstrap', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestedType, reactivationToken }),
    });

    if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const error = new Error(payload.error || 'Account setup failed.');
        error.code = payload.code;
        throw error;
    }

    return response.json();
}

async function requestDeletedAccountReactivation(email, requestedType) {
    const response = await fetch('/api/account/reactivate-deleted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, requestedType }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(payload.error || 'This account cannot be recreated through self-service.');
    }
    if (!payload.reactivationToken || !payload.requestedType) {
        throw new Error('Deleted account recreation could not be prepared. Start account recreation again.');
    }
    return payload;
}

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const signInWithGoogle = async (requestedType = null) => {
        if (!auth) {
            alert("Firebase Auth not initialized. Please check environment variables.");
            return;
        }
        const provider = new GoogleAuthProvider();
        try {
            storeSignupIntent(requestedType);
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Error signing in with Google:", error);
            if (error?.code === 'auth/user-disabled') {
                const disabledEmail = error?.customData?.email || error?.email;
                if (requestedType && disabledEmail) {
                    try {
                        await continueDeletedProviderReactivation({
                            auth,
                            provider,
                            email: disabledEmail,
                            requestedType,
                            requestDeletedAccountReactivation,
                            storeSignupIntent,
                        });
                        return;
                    } catch (reactivationError) {
                        console.error("Error recreating deleted Google account:", reactivationError);
                        alert(reactivationError.message || getDeletedAccountMessage(requestedType));
                        return;
                    }
                }
                alert(getDeletedAccountMessage(requestedType));
            } else {
                alert("Sign-In Error: " + error.message);
            }
        }
    };

    const signInWithGithub = async (requestedType = null) => {
        if (!auth) {
            alert("Firebase Auth not initialized. Please check environment variables.");
            return;
        }
        const provider = new GithubAuthProvider();
        try {
            storeSignupIntent(requestedType);
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Error signing in with Github:", error);
            if (error?.code === 'auth/user-disabled') {
                const disabledEmail = error?.customData?.email || error?.email;
                if (requestedType && disabledEmail) {
                    try {
                        await continueDeletedProviderReactivation({
                            auth,
                            provider,
                            email: disabledEmail,
                            requestedType,
                            requestDeletedAccountReactivation,
                            storeSignupIntent,
                        });
                        return;
                    } catch (reactivationError) {
                        console.error("Error recreating deleted Github account:", reactivationError);
                        alert(reactivationError.message || getDeletedAccountMessage(requestedType));
                        return;
                    }
                }
                alert(getDeletedAccountMessage(requestedType));
            } else {
                alert("Sign-In Error: " + error.message);
            }
        }
    };

    const signInWithEmail = async (email, password) => {
        if (!auth) {
            alert("Firebase Auth not initialized.");
            return;
        }
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error("Error signing in with email:", error);
            throw error;
        }
    };

    const signInWithPreview = async (secret) => {
        if (!auth) {
            throw new Error("Firebase Auth not initialized.");
        }
        const response = await fetch('/api/preview-auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ secret }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(payload.error || "Preview sign-in failed.");
        }
        await signInWithCustomToken(auth, payload.customToken);
    };

    const signUpWithEmail = async (email, password, requestedType = null) => {
        if (!auth) {
            alert("Firebase Auth not initialized.");
            return;
        }
        try {
            storeSignupIntent(requestedType);
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error("Error signing up with email:", error);
            throw error;
        }
    };

    const recreateDeletedAccountWithEmail = async (email, password, requestedType) => {
        if (!auth) {
            throw new Error("Firebase Auth not initialized.");
        }
        if (!requestedType || !isAccountType(requestedType)) {
            throw new Error("Choose a public account type before recreating this account.");
        }
        const reactivation = await requestDeletedAccountReactivation(email, requestedType);
        storeSignupIntent(requestedType, reactivation.reactivationToken);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            if (error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-credential') {
                throw new Error("This deleted account is ready to recreate. Sign in with the original password to confirm you own it.");
            }
            throw error;
        }
    };

    const logout = () => auth ? signOut(auth) : Promise.resolve();

    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                setUser(null);
                setLoading(false);
                return;
            }

            try {
                if (!db) {
                    console.warn("Firestore not initialized");
                    setUser({
                        uid: currentUser.uid,
                        email: currentUser.email,
                        displayName: currentUser.displayName,
                        photoURL: currentUser.photoURL,
                        accountType: null,
                        role: 'talent',
                        getIdToken: () => currentUser.getIdToken(),
                    });
                    setLoading(false);
                    return;
                }

                const userRef = doc(db, 'users', currentUser.uid);
                const userSnap = await getDoc(userRef);
                const storedRequestedType = window.sessionStorage.getItem(REQUESTED_ACCOUNT_TYPE_KEY);
                const reactivationToken = window.sessionStorage.getItem(REACTIVATION_TOKEN_KEY);
                const requestedType = isAccountType(storedRequestedType) ? storedRequestedType : null;
                clearSignupIntent();

                let profile;
                try {
                    profile = await bootstrapAccount(
                        currentUser,
                        userSnap.exists() && userSnap.data()?.accountType && !reactivationToken ? null : requestedType,
                        reactivationToken
                    );
                } catch (bootstrapError) {
                    if (reactivationToken || String(bootstrapError?.code || '').startsWith('DELETED_ACCOUNT_REACTIVATION_')) {
                        console.warn("Deleted account recreation bootstrap failed:", bootstrapError);
                        await signOut(auth);
                        setUser(null);
                        if (typeof window !== 'undefined') {
                            window.alert(bootstrapError.message || "Deleted account recreation needs to be restarted from sign up.");
                        }
                        return;
                    }
                    console.warn("Server bootstrap failed; falling back to client sync:", bootstrapError);
                    profile = await createOrSyncUserProfileFromAuth(
                        currentUser,
                        userSnap.exists() && userSnap.data()?.accountType ? null : requestedType
                    );
                }

                setUser({
                    ...profile,
                    getIdToken: () => currentUser.getIdToken(),
                });
            } catch (error) {
                console.error("Background Sync Error:", error);
                setUser({
                    uid: currentUser.uid,
                    email: currentUser.email,
                    displayName: currentUser.displayName,
                    photoURL: currentUser.photoURL,
                    accountType: null,
                    role: 'talent',
                    getIdToken: () => currentUser.getIdToken(),
                });
            } finally {
                setLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    const value = {
        user,
        signInWithGoogle,
        signInWithGithub,
        signInWithEmail,
        signInWithPreview,
        signUpWithEmail,
        recreateDeletedAccountWithEmail,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
