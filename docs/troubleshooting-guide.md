# Nija Wallet - Troubleshooting Guide

This guide provides solutions for common issues you might encounter when using or developing the Nija Wallet application.

## Ethereum Provider Conflicts

### Issue: Cannot redefine property: ethereum

**Error**: `Uncaught TypeError: Cannot redefine property: ethereum`

**Cause**: This error occurs when multiple wallet extensions (such as MetaMask and Nija Wallet) are trying to inject their own Ethereum provider into the browser window.

**Solution**:

1. **For Users**:
   - Disable other wallet extensions when using Nija Wallet
   - If you need to use both, try using Nija Wallet in a separate browser profile

2. **For Developers**:
   ```javascript
   // Improve provider injection with a more robust detection mechanism
   if (!window.ethereum) {
     console.log('No ethereum provider found, creating Nija Wallet provider');
     Object.defineProperty(window, 'ethereum', {
       value: {
         isNijaWallet: true,
         name: 'Nija Custodian Wallet',
         isMetaMask: false
       },
       writable: true,
       configurable: true
     });
   } else if (!window.ethereum.isNijaWallet) {
     console.log('Existing ethereum provider found, attempting to enhance with Nija Wallet capabilities');
     // Store original properties we need to maintain
     const originalProvider = { ...window.ethereum };
     
     // Create a proxy to handle property access without redefining properties
     try {
       window.nijaWalletProvider = {
         isNijaWallet: true,
         name: 'Nija Custodian Wallet',
         // Add methods that will be called through the proxy
         // These methods should be implemented to work with your backend
       };
       
       console.log('Successfully created Nija Wallet provider for fallback usage');
     } catch (e) {
       console.warn('Could not create Nija Wallet provider:', e);
     }
   }
   ```

## CORS Issues

### Issue: Failed to fetch cryptocurrency prices

**Error**: `Access to fetch at '...' from origin '...' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header`

**Cause**: The cryptocurrency price APIs (CoinGecko, Coinbase, etc.) block direct requests from browser extensions due to CORS policies.

**Solution**:

1. **Use Additional CORS Proxies**:
   - Add more fallback proxies to the array in `cryptoService.ts`
   - Consider self-hosting a CORS proxy specifically for the application

2. **Implement Server-Side Fetching**:
   - Create a small backend service that fetches prices and serves them to the wallet
   - This eliminates CORS issues completely

3. **Use APIs with CORS Support**:
   - Some APIs offer CORS-enabled endpoints specifically for client-side applications
   - Consider subscribing to paid APIs that provide better reliability and CORS support

4. **Implement Better Fallback and Caching**:
   - Enhance the existing caching mechanism to store prices for longer periods
   - Implement an exponential backoff strategy for retrying failed requests

## Chart Rendering Issues

### Issue: Lightweight-charts errors

**Error**: `Error: Assertion failed` or chart display issues

**Cause**: These errors typically occur due to initialization problems with the lightweight-charts library, often related to container dimensions or data formatting.

**Solution**:

1. **Ensure Proper Container Initialization**:
   ```javascript
   // Make sure the container has defined dimensions before chart creation
   useEffect(() => {
     if (!chartContainerRef.current) return;
     
     // Ensure the container has dimensions
     if (chartContainerRef.current.clientWidth === 0) {
       console.warn('Chart container has zero width, delaying initialization');
       const checkSize = () => {
         if (chartContainerRef.current?.clientWidth > 0) {
           initializeChart();
         } else {
           setTimeout(checkSize, 100);
         }
       };
       checkSize();
       return;
     }
     
     initializeChart();
   }, [theme]);
   ```

2. **Implement Better Error Boundaries**:
   - Wrap the chart component in a React Error Boundary
   - Provide a fallback UI when chart rendering fails

3. **Verify Data Format**:
   - Ensure the data being provided to the chart is properly formatted
   - Add additional validation before passing data to the chart

## Chrome Extension Issues

### Issue: Resources not accessible

**Error**: `Denying load of chrome-extension://... Resources must be listed in the web_accessible_resources manifest key`

**Cause**: The Chrome extension is trying to load resources that are not explicitly listed in the `web_accessible_resources` section of the manifest.json file.

**Solution**:

1. **Create or Update manifest.json**:
   ```json
   {
     "manifest_version": 3,
     "name": "Nija Wallet",
     "version": "1.0.0",
     "description": "Secure custodial wallet for crypto assets",
     "web_accessible_resources": [
       {
         "resources": [
           "assets/*",
           "images/*",
           "fonts/*",
           "scripts/*"
         ],
         "matches": ["<all_urls>"]
       }
     ],
     "permissions": [
       "storage",
       "activeTab"
     ],
     "host_permissions": [
       "https://*.alchemyapi.io/*",
       "https://*.infura.io/*"
     ]
   }
   ```

2. **For Developers Working on Web Version**:
   - If you're developing the web version (not the extension), mock the extension behavior
   - Create a test environment that doesn't rely on extension-specific features

## Network Connection Issues

### Issue: Failed to connect to API endpoints

**Error**: `Failed to fetch` or timeout errors

**Cause**: Network connectivity issues or API endpoint unavailability.

**Solution**:

1. **Implement Robust Retry Logic**:
   ```javascript
   const fetchWithRetry = async (url, options = {}, retries = 3, backoff = 300) => {
     try {
       const response = await fetch(url, {
         ...options,
         timeout: options.timeout || 5000
       });
       return response;
     } catch (error) {
       if (retries <= 0) throw error;
       
       console.log(`Retrying fetch to ${url} in ${backoff}ms. Attempts left: ${retries-1}`);
       await new Promise(resolve => setTimeout(resolve, backoff));
       return fetchWithRetry(url, options, retries - 1, backoff * 2);
     }
   };
   ```

2. **Use Multiple API Providers**:
   - Implement fallback mechanisms to switch between different API providers
   - For blockchain data, alternate between Alchemy, Infura, and other providers

3. **Implement Offline Mode**:
   - Add cache mechanisms to allow basic functionality when offline
   - Display clear messages to users about connectivity status

## React and UI Warning Fixes

### Issue: React Router warnings

**Warning**: `You are using the runtime-first flag without a router.`

**Solution**:
- Update React Router to the latest version
- Follow the migration guide to update your router configuration

### Issue: React Error #130 (Minified React error)

**Solution**:
- Include the development version of React during development
- Check for components that might be causing hydration mismatches
- Verify that server-rendered content matches client-side content

## Performance Issues

### Issue: Application feels slow or unresponsive

**Cause**: Excessive re-renders, inefficient data fetching, or heavy computations.

**Solution**:

1. **Implement React.memo and useCallback**:
   - Wrap components with `React.memo` to prevent unnecessary re-renders
   - Use `useCallback` for functions passed as props

2. **Optimize Data Fetching**:
   - Implement data prefetching for frequently accessed information
   - Use React Query or SWR for efficient data fetching and caching

3. **Web Worker for Heavy Tasks**:
   - Move heavy computations (like encryption/decryption) to Web Workers
   - Keep the main thread free for UI updates

## Getting Help

If you encounter issues not covered in this guide:

1. Check the application logs:
   ```bash
   tail -f /home/ubuntu/Sandeep/projects/Nwallet/logs/application.log
   ```

2. Look for errors in the browser console (F12 > Console)

3. Report issues with detailed information:
   - Browser version and OS
   - Steps to reproduce
   - Full error messages
   - Screenshots if applicable 