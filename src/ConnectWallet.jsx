import React, { useState } from 'react';
import { Wallet, ArrowLeft } from 'lucide-react';
import './ConnectWallet.css';

const ConnectWallet = ({ onConnected, onDisconnected }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [address, setAddress] = useState('');
    const [showWallets, setShowWallets] = useState(false);
    const [showMoreWallets, setShowMoreWallets] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState('');

    const popularWallets = [
        { name: 'MetaMask', icon: '🦊', color: 'from-orange-500 to-orange-600' },
        { name: 'Coinbase Wallet', icon: '💙', color: 'from-blue-500 to-blue-600' },
        { name: 'WalletConnect', icon: '🔗', color: 'from-purple-500 to-purple-600' },
        { name: 'Trust Wallet', icon: '🛡️', color: 'from-cyan-500 to-cyan-600' },
    ];

    const moreWallets = [
        { name: 'Rainbow', icon: '🌈', color: 'from-pink-500 to-purple-600' },
        { name: 'Phantom', icon: '👻', color: 'from-purple-600 to-indigo-600' },
        { name: 'Ledger', icon: '📱', color: 'from-gray-600 to-gray-700' },
        { name: 'Argent', icon: '🛡️', color: 'from-indigo-500 to-indigo-600' },
        { name: 'Safe', icon: '🔐', color: 'from-green-500 to-green-600' },
        { name: 'Zerion', icon: '⚡', color: 'from-yellow-500 to-yellow-600' },
        { name: 'Exodus', icon: '🚀', color: 'from-blue-600 to-purple-600' },
        { name: 'Trezor', icon: '🔒', color: 'from-green-600 to-teal-600' },
    ];

    const handleConnectClick = () => {
        setError('');
        setShowWallets(true);
    };

    const handleWalletPick = async (walletName) => {
        setError('');

        if (walletName !== 'MetaMask') {
            setError(`${ walletName } coming soon. Please use MetaMask.`);
            return;
        }

        if (!window.ethereum || !window.ethereum.isMetaMask) {
            setError('MetaMask is not installed. Please visit metamask.io and install it.');
            return;
        }

        setConnecting(true);

        try {
            // ✅ Only ask for account connection here — NO signature
            const permissions = await window.ethereum.request({
                method: 'wallet_requestPermissions',
                params: [{ eth_accounts: {} }]
            });

            if (!permissions || permissions.length === 0) {
                throw new Error('Permission denied. Please approve account access in MetaMask.');
            }

            const accounts = await window.ethereum.request({
                method: 'eth_accounts'
            });

            if (!accounts || accounts.length === 0) {
                throw new Error('No account found. Please unlock MetaMask and try again.');
            }

            const addr = accounts[0];

            // ✅ Just connected — no signature here
            setAddress(addr);
            setIsConnected(true);
            setShowWallets(false);
            setConnecting(false);
            onConnected(addr);

        } catch (err) {
            setConnecting(false);
            if (err.code === 4001) {
                setError('Request rejected. Please approve the connection in MetaMask to continue.');
            } else if (err.code === -32002) {
                setError('MetaMask is already open. Please check your MetaMask extension.');
            } else if (err.message?.includes('locked')) {
                setError('MetaMask is locked. Click the MetaMask extension icon, unlock it, then try again.');
            } else {
                setError(err.message || 'Connection failed. Please try again.');
            }
        }
    };
    const disconnectWallet = () => {
        setAddress('');
        setIsConnected(false);
        setShowWallets(false);
        setShowMoreWallets(false);
        setError('');
        if (onDisconnected) onDisconnected();
    };

    const isMetaMaskInstalled = typeof window !== 'undefined' &&
        typeof window.ethereum !== 'undefined' &&
        window.ethereum.isMetaMask;

    return (
        <div className="wallet-container">
            <div className="background-wrapper">
                <div className="grid-pattern"></div>
                <div className="particles-container">
                    {[...Array(20)].map((_, i) => (
                        <div key={i} className="particle" style={{
                            left: `${ Math.random() * 100 }%`,
                            top: `${ Math.random() * 100 }%`,
                            animationDelay: `${ Math.random() * 5 }s`,
                            animationDuration: `${ 5 + Math.random() * 10 }s`,
                        }} />
                    ))}
                </div>
            </div>

            <div className="wallet-card">
                <div className="wallet-header">
                    <div className="wallet-icon-circle">
                        <Wallet className="wallet-icon" />
                    </div>
                    <h1 className="wallet-title">
                        {isConnected ? 'Connected' : showWallets
                            ? (showMoreWallets ? 'All Wallets' : 'Choose Wallet')
                            : 'Connect Wallet'}
                    </h1>
                    <p className="wallet-subtitle">
                        {isConnected
                            ? 'Your wallet is connected'
                            : showWallets
                                ? 'Select your wallet to continue'
                                : 'Connect your wallet to access the platform'}
                    </p>
                </div>

                {/* MetaMask not installed warning */}
                {!isMetaMaskInstalled && (
                    <div style={{
                        background: 'rgba(251,191,36,.1)',
                        border: '1px solid rgba(251,191,36,.3)',
                        borderRadius: 8, padding: '10px 14px', marginBottom: 14,
                        fontSize: 13, color: '#fbbf24', textAlign: 'center', lineHeight: 1.6,
                    }}>
                        MetaMask not detected.{' '}
                        <a href="https://metamask.io" target="_blank" rel="noreferrer"
                            style={{ color: '#fbbf24', fontWeight: 600 }}>
                            Install MetaMask
                        </a>{' '}
                        then refresh this page.
                    </div>
                )}

                {error && (
                    <div style={{
                        background: 'rgba(239,68,68,.1)',
                        border: '1px solid rgba(239,68,68,.3)',
                        borderRadius: 8, padding: '10px 14px', marginBottom: 14,
                        fontSize: 13, color: '#ef4444', textAlign: 'center', lineHeight: 1.6,
                    }}>
                        {error}
                    </div>
                )}

                {/* CONNECTED STATE */}
                {isConnected ? (
                    <div className="connected-state">
                        <div className="address-container">
                            <p className="address-label">Connected Address</p>
                            <p className="address-text">
                                {address.substring(0, 6)}...{address.substring(address.length - 4)}
                            </p>
                        </div>
                        <button onClick={disconnectWallet} className="disconnect-button">
                            Disconnect
                        </button>
                    </div>

                    /* WALLET PICKER */
                ) : showWallets ? (
                    <div className="wallet-selection">
                        <button className="back-button" onClick={() => {
                            if (showMoreWallets) setShowMoreWallets(false);
                            else { setShowWallets(false); setError(''); }
                        }}>
                            <ArrowLeft className="back-icon" />
                            <span>Back</span>
                        </button>

                        {!showMoreWallets ? (
                            <div className="wallets-list">
                                {popularWallets.map((w, i) => (
                                    <button
                                        key={i}
                                        className="wallet-button"
                                        disabled={connecting}
                                        style={{
                                            opacity: connecting ? 0.5 : 1,
                                            cursor: connecting ? 'not-allowed' : 'pointer'
                                        }}
                                        onClick={() => handleWalletPick(w.name)}
                                    >
                                        <div className={`wallet-emoji-container ${ w.color }`}>
                                            {w.icon}
                                        </div>
                                        <span className="wallet-name">
                                            {connecting && w.name === 'MetaMask'
                                                ? 'Check MetaMask extension…'
                                                : w.name}
                                        </span>
                                    </button>
                                ))}
                                <button
                                    className="more-wallets-button"
                                    onClick={() => setShowMoreWallets(true)}
                                >
                                    More Wallets
                                </button>
                            </div>
                        ) : (
                            <div className="all-wallets-scrollable">
                                <div className="wallets-sections">
                                    <div className="wallet-section">
                                        <h3 className="section-title">Popular</h3>
                                        {popularWallets.map((w, i) => (
                                            <button key={`p-${ i }`} className="wallet-button"
                                                disabled={connecting}
                                                style={{ opacity: connecting ? 0.5 : 1 }}
                                                onClick={() => handleWalletPick(w.name)}>
                                                <div className={`wallet-emoji-container ${ w.color }`}>{w.icon}</div>
                                                <span className="wallet-name">{w.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="wallet-section">
                                        <h3 className="section-title">More Options</h3>
                                        {moreWallets.map((w, i) => (
                                            <button key={`m-${ i }`} className="wallet-button"
                                                disabled={connecting}
                                                style={{ opacity: connecting ? 0.5 : 1 }}
                                                onClick={() => handleWalletPick(w.name)}>
                                                <div className={`wallet-emoji-container ${ w.color }`}>{w.icon}</div>
                                                <span className="wallet-name">{w.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    /* INITIAL CONNECT BUTTON */
                ) : (
                    <button onClick={handleConnectClick} className="connect-button">
                        <Wallet className="connect-icon" />
                        Connect Wallet
                    </button>
                )}

                <div className="wallet-footer">
                    <p className="footer-text">
                        By connecting, you agree to our Terms of Service
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ConnectWallet;