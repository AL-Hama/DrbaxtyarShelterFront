import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { PawPrint } from "lucide-react";

import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import LanguageSwitcher from "../components/Navbar/LanguageSwitcher";

import api from "../services/api";
import { AuthContext } from "../contexts/AuthContext";

export default function Login() {
    const { t, i18n } = useTranslation();

    const navigate = useNavigate();

    const { login } = useContext(AuthContext);

    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm();



const onSubmit = async (formData) => {
    try {
        setLoading(true);

        const { data } = await api.post("/auth/login", formData);

        login(data.user, data.token);

        toast.success(t("toastLoginSucc"));

        navigate("/dashboard");

    } catch (err) {
        if (err.response?.status === 401) {
            toast.error(t("toastIncorrectUsernaemOrPassword"));
        } else if (err.response?.status === 404) {
            toast.error(t("toastLoginServiceNotFound"));
        } else if (err.response?.status === 500) {
            toast.error(t("toastServerError"));
        } else {
            toast.error(t("toastFailLogin"));
        }

        console.error(err);
    } finally {
        setLoading(false);
    }
};



    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-orange-50 via-white to-amber-100">

            <div className="absolute top-0 left-0 w-96 h-96 bg-orange-300/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-300/20 rounded-full blur-3xl" />

            <div className="absolute top-6 right-6">
                <LanguageSwitcher />
            </div>

            <div className="flex items-center justify-center min-h-screen p-4">

                <div className="w-full max-w-md">

                    <div className="bg-white/80 backdrop-blur-xl border border-white rounded-3xl shadow-2xl p-8">

                        {/* Logo */}

                        <div className="flex flex-col items-center mb-8">

                            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-300">

                                <PawPrint
                                    className="text-white"
                                    size={48}
                                />

                            </div>

                            <h1 className="mt-5 text-2xl font-bold text-center">

                                {t("appName")}

                            </h1>

                            <p className="text-gray-500 mt-2 text-center">

                                {t("manageSystem")}

                            </p>

                        </div>

                        <form
                            onSubmit={handleSubmit(onSubmit)}
                            dir={
                                ["ar", "ku"].includes(i18n.language)
                                    ? "rtl"
                                    : "ltr"
                            }
                            className="space-y-5"
                        >

                            <Input
                                label={t("username")}
                                placeholder={t("enterUsername")}
                                error={errors.username?.message}
                                {...register("username", {
                                    required: t("usernameRequired")
                                })}
                            />

                            <Input
                                type="password"
                                label={t("password")}
                                placeholder={t("enterPassword")}
                                error={errors.password?.message}
                                {...register("password", {
                                    required: t("passwordRequired")
                                })}
                            />

                            <div className="flex items-center gap-2">

                                <input
                                    type="checkbox"
                                    className="accent-orange-500"
                                />

                                <span className="text-sm text-gray-600">

                                    {t("rememberMe")}

                                </span>

                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                loading={loading}
                                disabled={loading}
                                className="w-full"
                            >

                                {loading
                                    ? t("loggingIn")
                                    : t("login")}

                            </Button>

                        </form>

                        <div className="mt-8 pt-5 border-t border-gray-100">

                            <div className="flex justify-center gap-3 text-xs text-gray-400">

                                <span>🐶 Dogs</span>

                                <span>•</span>

                                <span>🐱 Cats</span>

                                <span>•</span>

                                <span>🏠 Adoption</span>

                                <span>•</span>

                                <span>💳 POS</span>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}