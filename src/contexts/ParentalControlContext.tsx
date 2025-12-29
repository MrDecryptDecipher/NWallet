// Legacy context stubbed to fix build
import React, { createContext, useContext } from 'react';
const ParentalControlContext = createContext<any>({});
export const ParentalControlProvider = ({ children }: { children: React.ReactNode }) => <ParentalControlContext.Provider value={{}}>{children}</ParentalControlContext.Provider>;
export const useParentalControl = () => useContext(ParentalControlContext);
