import React, { useState } from "react";
import "./HamburgerMenu.css";

const HamburgerMenu = () => {
    const [isActive, setIsActive] = useState(false);

    const toggleMenu = () => {
        setIsActive(!isActive);
    };

    const handleMenuItemClick = (itemName) => {
        console.log("Clicked:", itemName);
        setIsActive(false);
    };

    const handleClickOutside = (e) => {
        if (e.target.classList.contains("hamburger-menu-wrapper")) {
            setIsActive(false);
        }
    };

    return (
        <div className="hamburger-menu-wrapper" onClick={handleClickOutside}>
            <div className={`menu-container ${ isActive ? "active" : "" }`}>
                <button className="main-button" onClick={toggleMenu}>
                    <div className="hamburger">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <div className="close">×</div>
                </button>

                <div className="menu-items">
                    <button
                        className="menu-item"
                        data-tooltip="Calendar"
                        onClick={() => handleMenuItemClick("Calendar")}
                    >
                        <svg viewBox="0 0 24 24">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                    </button>

                    <button
                        className="menu-item"
                        data-tooltip="Map"
                        onClick={() => handleMenuItemClick("Map")}
                    >
                        <svg viewBox="0 0 24 24">
                            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                            <line x1="8" y1="2" x2="8" y2="18"></line>
                            <line x1="16" y1="6" x2="16" y2="22"></line>
                        </svg>
                    </button>

                    <button
                        className="menu-item"
                        data-tooltip="Share"
                        onClick={() => handleMenuItemClick("Share")}
                    >
                        <svg viewBox="0 0 24 24">
                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                            <polyline points="16 6 12 2 8 6"></polyline>
                            <line x1="12" y1="2" x2="12" y2="15"></line>
                        </svg>
                    </button>

                    <button
                        className="menu-item"
                        data-tooltip="Code"
                        onClick={() => handleMenuItemClick("Code")}
                    >
                        <svg viewBox="0 0 24 24">
                            <polyline points="16 18 22 12 16 6"></polyline>
                            <polyline points="8 6 2 12 8 18"></polyline>
                        </svg>
                    </button>

                    <button
                        className="menu-item"
                        data-tooltip="Brightness"
                        onClick={() => handleMenuItemClick("Brightness")}
                    >
                        <svg viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="5"></circle>
                            <line x1="12" y1="1" x2="12" y2="3"></line>
                            <line x1="12" y1="21" x2="12" y2="23"></line>
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                            <line x1="1" y1="12" x2="3" y2="12"></line>
                            <line x1="21" y1="12" x2="23" y2="12"></line>
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HamburgerMenu;
