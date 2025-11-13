import { Component, createSignal, onMount } from 'solid-js';
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/plugin-shell';
import type { GitHubAuthResponse } from '../types';

const GitHubAuth: Component = () => {
  const [authStatus, setAuthStatus] = createSignal<'idle' | 'initiating' | 'waiting' | 'completed' | 'error'>('idle');
  const [deviceCode, setDeviceCode] = createSignal('');
  const [userCode, setUserCode] = createSignal('');
  const [verificationUri, setVerificationUri] = createSignal('');
  const [expiresAt, setExpiresAt] = createSignal<number>(0);
  const [error, setError] = createSignal('');

  const initiateAuth = async () => {
    setAuthStatus('initiating');
    setError('');
    
    try {
      // In a real implementation, this would call the GitHub device flow API
      // For now, we'll simulate the response
      const authResponse: GitHubAuthResponse = await invoke('authenticate_with_github');
      
      setDeviceCode(authResponse.device_code);
      setUserCode(authResponse.user_code);
      setVerificationUri(authResponse.verification_uri);
      setExpiresAt(Date.now() + authResponse.expires_in * 1000);
      
      // Open the verification URL in the user's browser
      await open(authResponse.verification_uri);
      
      setAuthStatus('waiting');
      
      // Start polling for token
      startPolling(authResponse.device_code, authResponse.interval);
    } catch (err) {
      console.error('GitHub auth error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setAuthStatus('error');
    }
  };

  const startPolling = async (deviceCode: string, interval: number) => {
    const pollInterval = setInterval(async () => {
      if (Date.now() > expiresAt()) {
        clearInterval(pollInterval);
        setAuthStatus('error');
        setError('Authentication request expired');
        return;
      }
      
      try {
        // This would call our Rust backend to poll GitHub for the token
        const result = await invoke('poll_github_token', { deviceCode });
        
        if (result && result.token) {
          clearInterval(pollInterval);
          setAuthStatus('completed');
          
          // Store the token securely
          await invoke('set_github_token', { token: result.token });
        }
      } catch (err) {
        // GitHub returns specific error codes for "authorization_pending" and "slow_down"
        // which are not actual errors, so we continue polling
        if (err instanceof Error && 
            (err.message.includes('authorization_pending') || 
             err.message.includes('slow_down'))) {
          // Continue polling
          return;
        }
        
        console.error('Error polling for token:', err);
        clearInterval(pollInterval);
        setAuthStatus('error');
        setError(err instanceof Error ? err.message : 'An error occurred during authentication');
      }
    }, interval * 1000);
  };

  const formatTimeRemaining = () => {
    const remaining = Math.floor((expiresAt() - Date.now()) / 1000);
    if (remaining <= 0) return 'Expired';
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div class="github-auth">
      <h2>GitHub Authentication</h2>
      
      {authStatus() === 'idle' && (
        <div>
          <p>Sign in to GitHub to sync your notes:</p>
          <button class="btn" onClick={initiateAuth}>Sign in with GitHub</button>
        </div>
      )}
      
      {authStatus() === 'initiating' && (
        <div>
          <p>Initiating authentication...</p>
        </div>
      )}
      
      {authStatus() === 'waiting' && (
        <div>
          <p>1. Visit: <a href={verificationUri()} target="_blank">{verificationUri()}</a></p>
          <p>2. Enter this code: <strong>{userCode()}</strong></p>
          <p>Time remaining: {formatTimeRemaining()}</p>
          <p>Waiting for you to complete authentication...</p>
        </div>
      )}
      
      {authStatus() === 'completed' && (
        <div>
          <p>✅ Successfully authenticated with GitHub!</p>
        </div>
      )}
      
      {authStatus() === 'error' && (
        <div>
          <p>❌ Authentication failed: {error()}</p>
          <button class="btn" onClick={initiateAuth}>Try Again</button>
        </div>
      )}
    </div>
  );
};

export default GitHubAuth;