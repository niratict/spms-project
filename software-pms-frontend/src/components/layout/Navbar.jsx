import React, { Fragment } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import { useAuth } from "../../context/AuthContext";
import {
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

// ===============================================
// ฟังก์ชั่นอรรถประโยชน์ (Utility Functions)
// ===============================================

/**
 * รวม CSS class ต่างๆเข้าด้วยกัน โดยจะใช้เฉพาะค่าที่ไม่เป็น falsy
 * @param {...string} classes - CSS classes ที่ต้องการรวม
 * @returns {string} - CSS classes ที่รวมแล้ว
 */
function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

// ===============================================
// คอมโพเนนต์หลัก Navbar
// ===============================================

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

  // ===============================================
  // ฟังก์ชัน Helper และการตั้งค่า
  // ===============================================

  /**
   * กำหนดรายการเมนูนำทางตามบทบาทของผู้ใช้
   * @param {string} role - บทบาทของผู้ใช้ (Admin, Tester, etc.)
   * @returns {Array} - รายการเมนูที่เหมาะสมกับบทบาทของผู้ใช้
   */
  const getNavigationItems = (role) => {
    // เมนูพื้นฐานที่ทุกบทบาทสามารถเข้าถึงได้
    const items = [
      { name: "หน้าหลัก", href: "/dashboard", current: false },
      { name: "ผลการทดสอบ", href: "/test-dashboard", current: false },
    ];

    // เพิ่มเมนูตามบทบาทของผู้ใช้
    switch (role) {
      case "Admin":
        items.push(
          { name: "โปรเจกต์", href: "/projects", current: false },
          { name: "สปรินต์", href: "/sprints", current: false },
          { name: "ไฟล์ทดสอบ", href: "/test-files", current: false },
          { name: "ผู้ใช้งาน", href: "/users", current: false },
          { name: "บันทึกการดำเนินการ", href: "/action-logs", current: false }
        );
        break;
      case "Tester":
        items.push({ name: "Test Files", href: "/test-files", current: false });
        break;
    }

    return items;
  };

  // รายการเมนูนำทางตามบทบาทของผู้ใช้
  const navigation = getNavigationItems(user?.role);

  /**
   * จัดการการออกจากระบบ โดยเรียกใช้ฟังก์ชัน logout จาก Auth context
   * และนำทางกลับไปยังหน้า login
   */
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // ===============================================
  // การแสดงผล Navbar
  // ===============================================
  return (
    <Disclosure
      as="nav"
      className="bg-gradient-to-r from-black to-blue-700 shadow-lg"
      // className="bg-gradient-to-r from-blue-900 to-blue-700 shadow-lg"
      data-cy="navbar"
    >
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative flex h-16 items-center justify-between">
              {/* ปุ่มเมนูสำหรับหน้าจอมือถือ */}
              <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                <Disclosure.Button
                  className="group relative inline-flex items-center justify-center rounded-md p-2 text-blue-200 hover:bg-blue-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition duration-300 ease-in-out transform hover:scale-110"
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
                {/* โลโก้ของระบบ */}
                <div className="flex flex-shrink-0 items-center">
                  <span
                    className="text-white font-bold text-2xl tracking-wider bg-blue-600 px-3 py-1 rounded-lg shadow-md transition duration-300 ease-in-out hover:bg-blue-500"
                    data-cy="app-logo"
                  >
                    SPMS
                  </span>
                </div>

                {/* เมนูนำทางสำหรับหน้าจอขนาดใหญ่ */}
                <div className="hidden sm:ml-6 sm:block">
                  <div className="flex space-x-4" data-cy="desktop-nav-menu">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={classNames(
                          "text-blue-200 hover:bg-blue-800 hover:text-white",
                          "rounded-md px-3 py-2 text-sm font-medium transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg"
                        )}
                        data-cy={`nav-item-${item.name}`}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* เมนูผู้ใช้ */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                <Menu as="div" className="relative ml-3">
                  <div>
                    <Menu.Button
                      className="group flex rounded-full bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      data-cy="user-menu-button"
                    >
                      <span className="sr-only">Open user menu</span>
                      <UserCircleIcon
                        className="h-9 w-9 text-blue-200 group-hover:text-white transition duration-300 ease-in-out transform group-hover:scale-110"
                        aria-hidden="true"
                      />
                    </Menu.Button>
                  </div>

                  {/* เมนูผู้ใช้แบบดรอปดาวน์ */}
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items
                      className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-lg bg-white shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden"
                      data-cy="user-dropdown-menu"
                    >
                      {/* รายการเมนูโปรไฟล์ */}
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            to="/profile"
                            className={classNames(
                              active
                                ? "bg-blue-50 text-blue-800"
                                : "text-gray-700",
                              "flex items-center w-full px-4 py-2 text-sm transition duration-300 ease-in-out hover:bg-blue-100"
                            )}
                            data-cy="profile-menu-item"
                          >
                            <UserIcon className="h-5 w-5 mr-2 text-blue-500" />
                            โปรไฟล์
                          </Link>
                        )}
                      </Menu.Item>
                      {/* รายการเมนูออกจากระบบ */}
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={handleLogout}
                            className={classNames(
                              active
                                ? "bg-blue-50 text-blue-800"
                                : "text-gray-700",
                              "flex items-center w-full px-4 py-2 text-sm transition duration-300 ease-in-out hover:bg-blue-100"
                            )}
                            data-cy="logout-menu-item"
                          >
                            <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2 text-blue-500" />
                            ออกจากระบบ
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
            </div>
          </div>

          {/* เมนูมือถือ (แสดงเมื่อกดปุ่มเมนูบนมือถือ) */}
          <Disclosure.Panel
            className="sm:hidden bg-blue-800"
            data-cy="mobile-menu-panel"
          >
            <div className="space-y-1 px-2 pb-3 pt-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={classNames(
                    "text-blue-200 hover:bg-blue-700 hover:text-white",
                    "block rounded-md px-3 py-2 text-base font-medium transition duration-300 ease-in-out"
                  )}
                  data-cy={`mobile-nav-item-${item.name}`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
