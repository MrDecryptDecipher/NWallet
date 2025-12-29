// Legacy hook stubbed to fix build
export const useDappConnection = () => {
    return { connect: async () => {}, disconnect: () => {}, isConnected: false, address: null };
};
