import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Inventory from "./pages/Inventory";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import MainLayout from "./layouts/MainLayout";
import Dogs from "./pages/Dogs";
import Procedures from "./pages/Procedures";
import Staff from "./pages/Staff";
import Suppliers from "./pages/Suppliers";
import Reports from "./pages/Reports";
import Tretments from "./pages/Treatments";
import Basket from "./pages/Basket";
import Sales from "./pages/Sales";
import InventoryHistory from "./pages/Inventoryhistory";
import Expenses from "./pages/Expenses";
import Rooms from "./pages/Rooms";
import Customers from "./pages/Customers";
import RoomHistory from "./pages/Roomhistory";
import Debts from "./pages/Debts";

export default function App() {
    return (
        <>
            <Toaster
                position="top-right"
                reverseOrder={false}
            />

            <Routes>
                <Route path="/" element={<Login />} />

                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <MainLayout>
                                <Dashboard />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <MainLayout>
                                <Profile />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />


                    <Route
                    path="/inventory"
                    element={
                        <ProtectedRoute>
                            <MainLayout>
                                <Inventory />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />


                <Route
                    path="/dogs"
                    element={
                        <ProtectedRoute>
                            <MainLayout>
                                <Dogs />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/procedures"
                    element={
                        <ProtectedRoute>
                            <MainLayout>
                                <Procedures />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/tretments"
                    element={
                        <ProtectedRoute>
                            <MainLayout>
                                <Tretments />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />
                

                <Route
                    path="/staff"
                    element={
                        <ProtectedRoute>
                            <MainLayout>
                                <Staff />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />


                <Route
                    path="/supplier"
                    element={
                        <ProtectedRoute>
                            <MainLayout>
                                <Suppliers />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />



                <Route
                    path="/reports"
                    element={
                        <ProtectedRoute>
                            <MainLayout>
                                <Reports />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/basket"
                    element={
                        <ProtectedRoute>
                            <MainLayout>
                                <Basket />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/sales"
                    element={
                        <ProtectedRoute>
                            <MainLayout>
                                <Sales />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/inventoryhistory"
                    element={
                        <ProtectedRoute>
                            <MainLayout>
                                <InventoryHistory />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />


                <Route
                    path="/expenses"
                    element={
                        <ProtectedRoute>
                            <MainLayout>
                                <Expenses />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/rooms"
                    element={
                        <ProtectedRoute>
                            <MainLayout>
                                <Rooms />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/customers"
                    element={
                        <ProtectedRoute>
                            <MainLayout>
                                <Customers />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/roomHistory"
                    element={
                        <ProtectedRoute>
                            <MainLayout>
                                <RoomHistory />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/debts"
                    element={
                        <ProtectedRoute>
                            <MainLayout>
                                <Debts />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />

            </Routes>
        </>
    );
}