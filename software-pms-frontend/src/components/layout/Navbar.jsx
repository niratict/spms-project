import React, { Fragment, useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import { useAuth } from "../../context/AuthContext";
import {
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon,
  ClipboardDocumentCheckIcon,
  FolderIcon,
  RocketLaunchIcon,
  DocumentTextIcon,
  UsersIcon,
  ClockIcon,
  BellIcon,
} from "@heroicons/react/24/outline";

/**
 * รวม CSS class ต่างๆเข้าด้วยกัน โดยจะใช้เฉพาะค่าที่ไม่เป็น falsy
 * @param {...string} classes - CSS classes ที่ต้องการรวม
 * @returns {string} - CSS classes ที่รวมแล้ว
 */
function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

/**
 * คอมโพเนนต์ Navbar หลักของระบบที่แสดงเมนูนำทางและข้อมูลผู้ใช้
 * ประกอบด้วย โลโก้, เมนูนำทาง และเมนูผู้ใช้
 * รองรับการแสดงผลทั้งบนหน้าจอขนาดใหญ่และหน้าจอมือถือ
 */
export default function EnhancedNavbar() {
  // ใช้ context สำหรับข้อมูลผู้ใช้และฟังก์ชันออกจากระบบ
  const { user, logout } = useAuth();
  // ใช้สำหรับการนำทางระหว่างหน้า
  const navigate = useNavigate();
  // ใช้สำหรับการตรวจสอบเส้นทางปัจจุบัน
  const location = useLocation();
  // State สำหรับการติดตามการเลื่อนหน้าจอ
  const [scrolled, setScrolled] = useState(false);
  // State สำหรับความสูงของ Navbar เพื่อกำหนด margin-bottom
  const [navbarHeight, setNavbarHeight] = useState(64); // ค่าเริ่มต้น 64px
  // Ref สำหรับ Disclosure component เพื่อควบคุมการเปิด/ปิด
  const disclosureRef = useRef(null);
  // Ref สำหรับ Menu component เพื่อควบคุมการเปิด/ปิด
  const menuButtonRef = useRef(null);
  // State สำหรับการควบคุมการเปิด/ปิดของ user menu
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // State สำหรับตรวจสอบขนาดหน้าจอ
  const [isLaptopOrSmaller, setIsLaptopOrSmaller] = useState(false);
  // State สำหรับการควบคุมการเปิด/ปิดของ more menu
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // Effect สำหรับตรวจจับการเลื่อนหน้าจอ
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [scrolled]);

  // Effect สำหรับการตรวจสอบขนาดหน้าจอ
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLaptopOrSmaller(window.innerWidth <= 1024);
    };

    // ตรวจสอบครั้งแรกและเมื่อขนาดหน้าจอเปลี่ยน
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []);

  // Effect สำหรับวัดความสูงของ Navbar
  useEffect(() => {
    const updateNavbarHeight = () => {
      const navbar = document.getElementById("main-navbar");
      if (navbar) {
        setNavbarHeight(navbar.offsetHeight);
      }
    };

    // วัดครั้งแรกและเมื่อหน้าจอเปลี่ยนขนาด
    updateNavbarHeight();
    window.addEventListener("resize", updateNavbarHeight);
    return () => {
      window.removeEventListener("resize", updateNavbarHeight);
    };
  }, []);

  // Effect สำหรับการปิด mobile menu เมื่อคลิกนอกพื้นที่
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        disclosureRef.current &&
        disclosureRef.current.contains &&
        !disclosureRef.current.contains(event.target)
      ) {
        // ตรวจสอบว่า mobile menu เปิดอยู่หรือไม่
        const menuPanel = document.querySelector(
          '[data-cy="mobile-menu-panel"]'
        );
        if (
          menuPanel &&
          window.getComputedStyle(menuPanel).display !== "none"
        ) {
          // ค้นหาปุ่มปิดและกดมัน
          const closeButton = document.querySelector(
            '[data-cy="mobile-menu-button"]'
          );
          if (closeButton) {
            closeButton.click();
          }
        }
      }

      // เพิ่มการตรวจสอบการคลิกนอกพื้นที่ user menu
      if (
        isMenuOpen &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target)
      ) {
        // ตรวจสอบว่าคลิกที่ dropdown หรือไม่
        const userDropdown = document.querySelector(
          '[data-cy="user-dropdown-menu"]'
        );
        if (userDropdown && !userDropdown.contains(event.target)) {
          setIsMenuOpen(false);
        }
      }

      // ปิด more menu เมื่อคลิกนอกพื้นที่
      if (isMoreMenuOpen) {
        const moreMenuDropdown = document.querySelector(
          '[data-cy="more-menu-dropdown"]'
        );
        if (
          moreMenuDropdown &&
          !moreMenuDropdown.contains(event.target) &&
          !event.target.closest('[data-cy="more-menu-button"]')
        ) {
          setIsMoreMenuOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen, isMoreMenuOpen]);

  /**
   * กำหนดรายการเมนูนำทางตามบทบาทของผู้ใช้ พร้อม icon
   * @param {string} role - บทบาทของผู้ใช้ (Admin, Tester, etc.)
   * @returns {Array} - รายการเมนูที่เหมาะสมกับบทบาทของผู้ใช้
   */
  const getNavigationItems = (role) => {
    // เมนูพื้นฐานที่ทุกบทบาทสามารถเข้าถึงได้
    const items = [
      { name: "หน้าหลัก", href: "/dashboard", icon: HomeIcon },
      {
        name: "ผลการทดสอบ",
        href: "/test-dashboard",
        icon: ClipboardDocumentCheckIcon,
      },
    ];

    // เพิ่มเมนูตามบทบาทของผู้ใช้
    switch (role) {
      case "Admin":
        items.push(
          { name: "โปรเจกต์", href: "/projects", icon: FolderIcon },
          { name: "สปรินต์", href: "/sprints", icon: RocketLaunchIcon },
          { name: "ไฟล์ทดสอบ", href: "/test-files", icon: DocumentTextIcon },
          { name: "ผู้ใช้งาน", href: "/users", icon: UsersIcon },
          { name: "บันทึกการดำเนินการ", href: "/action-logs", icon: ClockIcon }
        );
        break;
      case "Tester":
        items.push({
          name: "ไฟล์ทดสอบ",
          href: "/test-files",
          icon: DocumentTextIcon,
        });
        break;
    }

    // เพิ่ม current flag โดยตรวจสอบกับเส้นทางปัจจุบัน
    return items.map((item) => ({
      ...item,
      current: location.pathname === item.href,
    }));
  };

  // รายการเมนูนำทางตามบทบาทของผู้ใช้
  const navigation = getNavigationItems(user?.role);

  // แบ่งเมนูสำหรับ laptop mode
  const getMenusForDisplay = () => {
    if (!isLaptopOrSmaller || navigation.length <= 4) {
      return { mainMenus: navigation, moreMenus: [] };
    }

    return {
      mainMenus: navigation.slice(0, 4),
      moreMenus: navigation.slice(4),
    };
  };

  const { mainMenus, moreMenus } = getMenusForDisplay();

  /**
   * จัดการการออกจากระบบ โดยเรียกใช้ฟังก์ชัน logout จาก Auth context
   * และนำทางกลับไปยังหน้า login
   */
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  /**
   * จัดการการปิด mobile menu เมื่อคลิกที่เมนู
   * @param {object} disclosure - Disclosure object จาก headlessUI
   */
  const handleNavItemClick = (disclosure) => {
    if (disclosure && disclosure.close && window.innerWidth < 640) {
      disclosure.close();
    }
  };

  // สลับสถานะเมนูผู้ใช้
  const toggleUserMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    if (isMoreMenuOpen) setIsMoreMenuOpen(false);
  };

  // ปิดเมนูผู้ใช้
  const closeUserMenu = () => {
    setIsMenuOpen(false);
  };

  // สลับสถานะเมนูเพิ่มเติม
  const toggleMoreMenu = () => {
    setIsMoreMenuOpen(!isMoreMenuOpen);
    if (isMenuOpen) setIsMenuOpen(false);
  };

  // ===============================================
  // การแสดงผล Navbar
  // ===============================================
  return (
    <>
      {/* Navbar หลัก */}
      <Disclosure
        as="nav"
        id="main-navbar"
        className={classNames(
          "fixed w-full z-50 transition-all duration-300",
          scrolled
            ? "bg-black/90 backdrop-blur-md shadow-xl"
            : "bg-gradient-to-r from-black to-blue-700"
        )}
        data-cy="navbar"
      >
        {({ open, close }) => (
          <>
            <div
              ref={disclosureRef}
              className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-8"
            >
              <div className="relative flex h-16 items-center justify-between">
                {/* ปุ่มเมนูสำหรับหน้าจอมือถือ */}
                <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                  <Disclosure.Button
                    className="group relative inline-flex items-center justify-center rounded-full p-2 text-blue-200 hover:bg-blue-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition duration-300 ease-in-out transform hover:scale-110"
                    data-cy="mobile-menu-button"
                  >
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XMarkIcon
                        className="block h-6 w-6 transition duration-300 ease-in-out"
                        aria-hidden="true"
                      />
                    ) : (
                      <Bars3Icon
                        className="block h-6 w-6 transition duration-300 ease-in-out"
                        aria-hidden="true"
                      />
                    )}
                  </Disclosure.Button>
                </div>

                {/* โลโก้และเมนูนำทางหลัก */}
                <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                  {/* โลโก้ของระบบที่มีการเคลื่อนไหว */}
                  <div className="flex flex-shrink-0 items-center">
                    <Link
                      to="/dashboard"
                      className="group flex items-center space-x-2"
                      data-cy="app-logo"
                    >
                      <span className="relative text-white font-bold text-xl md:text-2xl tracking-wider bg-gradient-to-r from-blue-600 to-blue-400 px-3 py-1 rounded-lg shadow-md transition duration-300 ease-in-out transform group-hover:scale-105 group-hover:shadow-blue-400/50">
                        SPMS
                        <span className="absolute -top-2 -right-2 flex h-3 w-3 md:h-4 md:w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-300 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 md:h-4 md:w-4 bg-blue-500"></span>
                        </span>
                      </span>
                    </Link>
                  </div>

                  {/* เมนูนำทางสำหรับหน้าจอขนาดใหญ่ */}
                  <div className="hidden sm:ml-6 sm:block">
                    <div
                      className="flex items-center space-x-1 lg:space-x-3"
                      data-cy="desktop-nav-menu"
                    >
                      {/* แสดงเมนูหลัก */}
                      {mainMenus.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.name}
                            to={item.href}
                            className={classNames(
                              item.current
                                ? "bg-blue-700 text-white shadow-md shadow-blue-500/20"
                                : "text-blue-200 hover:bg-blue-700/80 hover:text-white",
                              "group rounded-lg px-2 lg:px-3 py-2 text-xs md:text-sm font-medium transition duration-300 ease-in-out flex items-center space-x-1 hover:shadow-lg"
                            )}
                            data-cy={`nav-item-${item.name}`}
                          >
                            {Icon && (
                              <Icon
                                className={classNames(
                                  "h-4 w-4 md:h-5 md:w-5 transition-all duration-300 ease-in-out",
                                  item.current
                                    ? "text-white"
                                    : "group-hover:text-white"
                                )}
                              />
                            )}
                            <span className="relative whitespace-nowrap">
                              {item.name}
                              {item.current && (
                                <span className="absolute -bottom-1 left-0 h-0.5 w-full bg-blue-300 rounded-full transform scale-x-100 transition-transform duration-300"></span>
                              )}
                            </span>
                          </Link>
                        );
                      })}

                      {/* ปุ่ม "เพิ่มเติม" สำหรับเมนูที่เหลือบน laptop */}
                      {moreMenus.length > 0 && (
                        <div className="relative">
                          <button
                            onClick={toggleMoreMenu}
                            className={classNames(
                              moreMenus.some((item) => item.current)
                                ? "bg-blue-700 text-white shadow-md shadow-blue-500/20"
                                : "text-blue-200 hover:bg-blue-700/80 hover:text-white",
                              "group rounded-lg px-2 lg:px-3 py-2 text-xs md:text-sm font-medium transition duration-300 ease-in-out flex items-center space-x-1 hover:shadow-lg"
                            )}
                            data-cy="more-menu-button"
                          >
                            <span className="relative whitespace-nowrap flex items-center">
                              เพิ่มเติม
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 ml-1"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </span>
                          </button>

                          {/* ดรอปดาวน์เมนูสำหรับเมนูที่เหลือ */}
                          <Transition
                            show={isMoreMenuOpen}
                            as={Fragment}
                            enter="transition ease-out duration-200"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-150"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                          >
                            <div
                              className="absolute left-0 z-10 mt-2 w-56 origin-top-left rounded-xl bg-white shadow-2xl ring-1 ring-black/5 focus:outline-none overflow-hidden"
                              data-cy="more-menu-dropdown"
                            >
                              <div className="py-1">
                                {moreMenus.map((item) => {
                                  const Icon = item.icon;
                                  return (
                                    <Link
                                      key={item.name}
                                      to={item.href}
                                      className={classNames(
                                        item.current
                                          ? "bg-blue-50 text-blue-700"
                                          : "text-gray-700 hover:bg-blue-50 hover:text-blue-700",
                                        "flex items-center w-full px-4 py-2 text-sm transition duration-300 ease-in-out"
                                      )}
                                      data-cy={`more-menu-item-${item.name}`}
                                      onClick={() => setIsMoreMenuOpen(false)}
                                    >
                                      {Icon && (
                                        <Icon
                                          className="h-5 w-5 mr-2 text-blue-500"
                                          aria-hidden="true"
                                        />
                                      )}
                                      <span>{item.name}</span>
                                      {item.current && (
                                        <span className="ml-auto bg-blue-500 h-2 w-2 rounded-full" />
                                      )}
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          </Transition>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* เมนูผู้ใช้และการแจ้งเตือน */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0 space-x-2 md:space-x-3">
                  {/* เมนูผู้ใช้ใช้ state ควบคุมแทน Menu component */}
                  <div className="relative ml-2">
                    <div>
                      <button
                        ref={menuButtonRef}
                        onClick={toggleUserMenu}
                        className="group flex items-center space-x-2 rounded-full bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        data-cy="user-menu-button"
                      >
                        <span className="sr-only">Open user menu</span>
                        <UserCircleIcon
                          className="h-7 w-7 md:h-8 md:w-8 text-blue-200 group-hover:text-white transition duration-300 ease-in-out transform group-hover:scale-110"
                          aria-hidden="true"
                        />
                        <span className="hidden lg:block text-blue-200 text-sm font-medium group-hover:text-white">
                          {user?.name && user.name}
                        </span>
                      </button>
                    </div>

                    {/* เมนูผู้ใช้แบบดรอปดาวน์ */}
                    <Transition
                      show={isMenuOpen}
                      as={Fragment}
                      enter="transition ease-out duration-200"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-150"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <div
                        className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-xl bg-white shadow-2xl ring-1 ring-black/5 focus:outline-none overflow-hidden divide-y divide-gray-100"
                        data-cy="user-dropdown-menu"
                      >
                        {/* รายการเมนูโปรไฟล์ */}
                        <div className="py-1">
                          <Link
                            to="/profile"
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-800 transition duration-300 ease-in-out"
                            data-cy="profile-menu-item"
                            onClick={closeUserMenu}
                          >
                            <UserIcon className="h-5 w-5 mr-2 text-blue-500" />
                            โปรไฟล์
                          </Link>
                        </div>

                        {/* รายการเมนูออกจากระบบ */}
                        <div className="py-1">
                          <button
                            onClick={() => {
                              closeUserMenu();
                              handleLogout();
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition duration-300 ease-in-out"
                            data-cy="logout-menu-item"
                          >
                            <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2 text-red-500" />
                            ออกจากระบบ
                          </button>
                        </div>
                      </div>
                    </Transition>
                  </div>
                </div>
              </div>
            </div>

            {/* เมนูมือถือ (แสดงเมื่อกดปุ่มเมนูบนมือถือ) */}
            <Transition
              enter="transition duration-200 ease-out"
              enterFrom="opacity-0 -translate-y-2"
              enterTo="opacity-100 translate-y-0"
              leave="transition duration-150 ease-out"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 -translate-y-2"
            >
              <Disclosure.Panel
                className="sm:hidden bg-black/90 backdrop-blur-md rounded-b-xl shadow-xl"
                data-cy="mobile-menu-panel"
              >
                <div className="space-y-1 px-2 pb-3 pt-2 max-h-[70vh] overflow-y-auto">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={classNames(
                          item.current
                            ? "bg-blue-700 text-white"
                            : "text-blue-200 hover:bg-blue-700/80 hover:text-white",
                          "flex items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition duration-300 ease-in-out"
                        )}
                        data-cy={`mobile-nav-item-${item.name}`}
                        onClick={() => handleNavItemClick({ close })}
                      >
                        {Icon && (
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        )}
                        <span>{item.name}</span>
                        {item.current && (
                          <span className="ml-auto bg-blue-500 h-2 w-2 rounded-full" />
                        )}
                      </Link>
                    );
                  })}

                  {/* ปุ่มปิดเพิ่มเติมสำหรับมือถือ */}
                  <button
                    onClick={() => close()}
                    className="w-full mt-4 flex items-center justify-center rounded-lg bg-blue-700/50 px-3 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition duration-300 ease-in-out"
                    data-cy="mobile-close-button"
                  >
                    <XMarkIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                    ปิดเมนู
                  </button>
                </div>
              </Disclosure.Panel>
            </Transition>
          </>
        )}
      </Disclosure>

      {/* ส่วนสำหรับเพิ่ม margin-bottom เพื่อไม่ให้เนื้อหาชิดกับ navbar */}
      <div style={{ height: `${navbarHeight}px` }} className="w-full"></div>
    </>
  );
}
