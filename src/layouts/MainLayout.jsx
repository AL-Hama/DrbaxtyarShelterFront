import Navbar from "../components/Navbar/Navbar";

export default function MainLayout({ children }) {

    return (

        <div className="min-h-screen bg-gray-100">

            <Navbar />

            <div className="p-8">

                {children}

            </div>

        </div>

    );

}