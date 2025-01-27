import React, { Fragment } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import { useAuth } from "../../context/AuthContext";
import {
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function EnhancedNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const getNavigationItems = (role) => {
    const items = [
      { name: "Dashboard", href: "/dashboard", current: false },
      { name: "Test Dashboard", href: "/test-dashboard", current: false },
    ];

    switch (role) {
      case "Admin":
        items.push(
          { name: "Projects", href: "/projects", current: false },
          { name: "Sprints", href: "/sprints", current: false },
          { name: "Test Files", href: "/test-files", current: false },
          { name: "Users", href: "/users", current: false },
          { name: "Action Logs", href: "/action-logs", current: false }
        );
        break;
      case "Tester":
        items.push({ name: "Test Files", href: "/test-files", current: false });
        break;
    }

    return items;
  };

  const navigation = getNavigationItems(user?.role);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Disclosure
      as="nav"
      className="bg-gradient-to-r from-black to-blue-700 shadow-lg"
      // className="bg-gradient-to-r from-blue-900 to-blue-700 shadow-lg"
    >
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative flex h-16 items-center justify-between">
              {/* Mobile menu button */}
              <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                <Disclosure.Button className="group relative inline-flex items-center justify-center rounded-md p-2 text-blue-200 hover:bg-blue-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition duration-300 ease-in-out transform hover:scale-110">
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

              {/* Logo and Navigation */}
              <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                <div className="flex flex-shrink-0 items-center">
                  <span className="text-white font-bold text-2xl tracking-wider bg-blue-600 px-3 py-1 rounded-lg shadow-md transition duration-300 ease-in-out hover:bg-blue-500">
                    SPMS
                  </span>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden sm:ml-6 sm:block">
                  <div className="flex space-x-4">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={classNames(
                          "text-blue-200 hover:bg-blue-800 hover:text-white",
                          "rounded-md px-3 py-2 text-sm font-medium transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg"
                        )}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* User Menu */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                <Menu as="div" className="relative ml-3">
                  <div>
                    <Menu.Button className="group flex rounded-full bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                      <span className="sr-only">Open user menu</span>
                      <UserCircleIcon
                        className="h-9 w-9 text-blue-200 group-hover:text-white transition duration-300 ease-in-out transform group-hover:scale-110"
                        aria-hidden="true"
                      />
                    </Menu.Button>
                  </div>

                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-lg bg-white shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden">
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
                          >
                            <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2 text-blue-500" />
                            Sign out
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
            </div>
          </div>

          {/* Mobile Navigation Panel */}
          <Disclosure.Panel className="sm:hidden bg-blue-800">
            <div className="space-y-1 px-2 pb-3 pt-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={classNames(
                    "text-blue-200 hover:bg-blue-700 hover:text-white",
                    "block rounded-md px-3 py-2 text-base font-medium transition duration-300 ease-in-out"
                  )}
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
