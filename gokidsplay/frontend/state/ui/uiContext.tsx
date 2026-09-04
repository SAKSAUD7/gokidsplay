"use client";

import React, { createContext, useContext, useReducer, ReactNode } from "react";

interface UIState {
    isMobileMenuOpen: boolean;
    isBookingModalOpen: boolean;
}

type UIAction =
    | { type: "TOGGLE_MOBILE_MENU" }
    | { type: "CLOSE_MOBILE_MENU" }
    | { type: "OPEN_BOOKING_MODAL" }
    | { type: "CLOSE_BOOKING_MODAL" };

const initialState: UIState = {
    isMobileMenuOpen: false,
    isBookingModalOpen: false,
};

const uiReducer = (state: UIState, action: UIAction): UIState => {
    switch (action.type) {
        case "TOGGLE_MOBILE_MENU":
            return { ...state, isMobileMenuOpen: !state.isMobileMenuOpen };
        case "CLOSE_MOBILE_MENU":
            return { ...state, isMobileMenuOpen: false };
        case "OPEN_BOOKING_MODAL":
            return { ...state, isBookingModalOpen: true };
        case "CLOSE_BOOKING_MODAL":
            return { ...state, isBookingModalOpen: false };
        default:
            return state;
    }
};

const UIContext = createContext<{
    state: UIState;
    dispatch: React.Dispatch<UIAction>;
} | null>(null);

export const UIProvider = ({ children }: { children: ReactNode }) => {
    const [state, dispatch] = useReducer(uiReducer, initialState);

    return (
        <UIContext.Provider value={{ state, dispatch }}>
            {children}
        </UIContext.Provider>
    );
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error("useUI must be used within a UIProvider");
    }
    return context;
};
