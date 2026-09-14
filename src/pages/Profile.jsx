import { useEffect, useState } from "react";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import toast from "react-hot-toast";
import LanguageSwitcher from "../components/Navbar/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";


const ProfilePage = () => {
  const { t, i18n } = useTranslation();
  const { user, setUser } = useContext(AuthContext);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [passwordForm, setPasswordForm] = useState({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const [changingPassword, setChangingPassword] = useState(false);
const auth = useContext(AuthContext);
console.log(auth);
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/user/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      setUser(data);
      setForm(data);
    };

    fetchUser();
  }, []);

  if (!user) return <p className="text-center mt-10 text-gray-500">Loading profile...</p>;

  const isAdmin = user.role === "admin";

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  
  const handleSave = async () => {
    
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/user/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || t("toastFaildUpdateProfile"));
        return;
      }

      setUser(data);
      setForm(data);
      setEditMode(false);

      localStorage.setItem("user", JSON.stringify(data));

      toast.success(t("toastUpdateSaccessful"));
    } catch (error) {
      toast.error(t("toastWrong"));
    }
  };


  const handlePasswordChange = (e) => {
  setPasswordForm({
    ...passwordForm,
    [e.target.name]: e.target.value,
  });
};



const handleChangePassword = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    toast.error(t("toastmisMatchPassword"));
    return;
  }

  if (passwordForm.newPassword.length < 6) {
    toast.error(t("toastShortPassword"));
    return;
  }

  try {
    setChangingPassword(true);
    const loading = toast.loading(t("toastUpdaintPassword"));

    const token = localStorage.getItem("token");

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/user/change-password`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(passwordForm),
      }
    );

    const data = await res.json();
    toast.dismiss(loading);

    if (!res.ok) {
      toast.error(data.message || t("toastFaildPasswordUpdate"));
      return;
    }

    toast.success(t("toastPasswordUpdated"));

    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  } catch (err) {
    toast.error(t("toastServerError"));
  } finally {
    setChangingPassword(false);
  }
};

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="shadow-lg rounded-2xl border border-gray-100">

        {/* Header */}
        <div dir={ ["ar", "ku"].includes(i18n.language)
                         ? "rtl"
                        : "ltr"
                        }  className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {t("profileHeader")}
            </h2>
            <p className="text-sm text-gray-500">
              {t("profileSubTitle")}
            </p>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              isAdmin
                ? "bg-red-100 text-red-600"
                : "bg-green-100 text-green-600"
            }`}
          >
            {user.role}
          </span>
        </div>

        {/* Form Grid */}
        <div dir={ ["ar", "ku"].includes(i18n.language)
                         ? "rtl"
                        : "ltr"
                        }  className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <Input
            label={t("firstname")}
            name="firstName"
            value={form.firstName || ""}
            onChange={handleChange}
            disabled={!isAdmin || !editMode}
          />

          <Input
            label={t("lastname")}
            name="lastName"
            value={form.lastName || ""}
            onChange={handleChange}
            disabled={!isAdmin || !editMode}
          />

          <Input
            label={t("email")}
            name="email"
            value={form.email || ""}
            onChange={handleChange}
            disabled={!isAdmin || !editMode}
          />

          <Input
            label={t("username")}
            name="username"
            value={form.username || ""}
            onChange={handleChange}
            disabled={!isAdmin || !editMode}
          />

          <Input
            label={t("phone")}
            name="phone"
            value={form.phone || ""}
            onChange={handleChange}
            disabled={!isAdmin || !editMode}
          />

          <Input
            label={t("role")}
            name="role"
            value={form.role || ""}
            disabled
          />
        </div>

        {/* Actions */}
        <div dir={ ["ar", "ku"].includes(i18n.language)
                         ? "rtl"
                        : "ltr"
                        } className="flex justify-end gap-3 mt-6 pt-4 border-t">
          {isAdmin && !editMode && (
            <Button className="cursor-pointer" onClick={() => setEditMode(true)}>
              {t("editProfile")}
            </Button>
          )}

          {isAdmin && editMode && (
            <>
              <Button className="cursor-pointer" onClick={handleSave}>
                {t("saveChange")}
              </Button>

              <Button
                className="cursor-pointer"
                variant="secondary"
                onClick={() => {
                  setForm(user);
                  setEditMode(false);
                }}
              >
                {t("cancel")}
              </Button>
            </>
          )}
        </div>
      </Card>



      <div dir={ ["ar", "ku"].includes(i18n.language)
                         ? "rtl"
                        : "ltr"
                        }  className="mt-6">
          <Card className="border border-gray-100 rounded-2xl shadow-sm">

            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {t("changePassword")}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <Input
                label={t("currentPassword")}
                name="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
              />

              <Input
                label={t("newPassword")}
                name="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
              />

              <Input
                label={t("confirmPassword")}
                name="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
              />
            </div>

            <div className="flex justify-end mt-4">
              <Button
                className="cursor-pointer"
                onClick={handleChangePassword}
                disabled={changingPassword}
              >
                {t("updatePassword")}
              </Button>
            </div>
          </Card>
        </div>
    </div>
  );
};

export default ProfilePage;