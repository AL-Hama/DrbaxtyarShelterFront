import { useEffect, useMemo, useState } from "react";
import {
  Users,
  UserPlus,
  Search,
  Trash2,
  Pencil,
  Shield,
  Stethoscope,
  UserCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router-dom";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
} from "../services/userService";

export default function Staff() {
    const { user } = useAuth();

  if (user?.role?.toLowerCase() !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [passwordUser, setPasswordUser] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { t, i18n } = useTranslation();
  const [openModal, setOpenModal] =
    useState(false);

  const [editingUser, setEditingUser] =
    useState(null);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    username: "",
    password: "",
    role: "Employee",
    position: "",
    phone: "",
    email: "",
    salary: "",
    is_active: true,
  });


  const validateForm = () => {
  const missing = [];

  if (!form.first_name.trim()) missing.push("First Name");
  if (!form.last_name.trim()) missing.push("Last Name");
  if (!form.username.trim()) missing.push("Username");
  if (!editingUser && !form.password.trim()) missing.push("Password");
  if (!form.position.trim()) missing.push("Position");
  if (!form.phone.trim()) missing.push("Phone");
  if (!form.role.trim()) missing.push("Role");

  if (missing.length > 0) {
    toast.error(
      `${t("fillAllFields")} \n${missing.join(", ")}`
    );
    return false;
  }

  return true;
};



  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      toast.error(
      t("failedLoadStaff")
);
    }
  };

    const formatIQD = (amount) =>
  new Intl.NumberFormat("en-IQ", {
    maximumFractionDigits: 0,
  }).format(amount);

  const resetForm = () => {
    setForm({
      first_name: "",
      last_name: "",
      username: "",
      password: "",
      role: "Employee",
      position: "",
      phone: "",
      email: "",
      salary: "",
      is_active: true,
    });

    setEditingUser(null);
  };


  const handlePasswordChange = async () => {
  if (!passwordUser) {
    return toast.error(t("selectUser"));
  }

  if (newPassword.length < 6) {
    return toast.error(
      t("toastShortPassword")
    );
  }

  if (newPassword !== confirmPassword) {
    return toast.error(
      t("passwordsDoNotMatch")
    );
  }

  try {
    await changePassword(
      passwordUser,
      newPassword
    );

    toast.success(t("toastPasswordUpdated"));

    setPasswordUser("");
    setNewPassword("");
    setConfirmPassword("");

  } catch (err) {
    console.error(err);
    toast.error(
      err.response?.data?.message ||
      t("toastFaildPasswordUpdate")
    );
  }
};

const handleSubmit = async () => {
  if (!validateForm()) return;
  try {
    if (editingUser) {
      await updateUser(
        editingUser.id,
        form
      );

      toast.success(
        t("staffUpdatedSuccessfully")
      );
    } else {
      await createUser(form);

      toast.success(
        t("staffAccountCreated")
      );
    }

    setOpenModal(false);

    resetForm();

    loadUsers();

  } catch (err) {
    console.error(err);

    toast.error(
      err.response?.data?.message ||
      t("operationFailed")
    );
  }
};
  const handleEdit = (user) => {
    setEditingUser(user);

setForm({
  first_name: user.first_name || "",
  last_name: user.last_name || "",
  username: user.username || "",
  password: "",
  role: user.role || "",
  position: user.position || "",
  phone: user.phone || "",
  email: user.email || "",
  salary: user.salary || "",
  is_active: user.is_active ?? true,
});
    setOpenModal(true);
  };

const handleDelete = async (id) => {
  if (
    !window.confirm(
      t("deleteEmployee")
    )
  )
    return;

  try {
    await deleteUser(id);

    toast.success(
      t("staffDeletedSuccessfully")
    );

    loadUsers();

  } catch (err) {
    console.error(err);

    toast.error(
      t("failedDeleteStaff")
    );
  }
};

const filteredUsers = useMemo(() => {
  return users.filter((user) => {
    const matchesSearch = `
      ${user.first_name}
      ${user.last_name}
      ${user.username}
      ${user.role}
    `
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesRole =
      roleFilter === "All" ||
      user.role === roleFilter;

    return matchesSearch && matchesRole;
  });
}, [users, search, roleFilter]);

  const totalStaff =
    users.length;

  const vets = users.filter(
    (u) =>
      u.role?.toLowerCase() ===
      "veterinarian"
  ).length;

  const activeUsers =
    users.filter(
      (u) => u.is_active
    ).length;

  const admins = users.filter(
    (u) =>
      u.role?.toLowerCase() ===
      "admin"
  ).length;

  const roleBadge = (role) => {
    switch (
      role?.toLowerCase()
    ) {
      case "admin":
        return "bg-red-100 text-red-700";

      case "veterinarian":
        return "bg-blue-100 text-blue-700";

      case "manager":
        return "bg-purple-100 text-purple-700";

      default:
        return "bg-orange-100 text-orange-700";
    }
  };

  return (
    <div  className="space-y-6">

      <div dir={ ["ar", "ku"].includes(i18n.language)
                         ? "rtl"
                        : "ltr"
                        }>
        <h1 className="text-3xl font-bold text-gray-800">
          {t("staffManagement")}
        </h1>

        <p className="text-gray-500">
          {t("manageShelterEmployees")}
        </p>
      </div>

      <div dir={ ["ar", "ku"].includes(i18n.language)
                         ? "rtl"
                        : "ltr"
                        } className="grid md:grid-cols-4 gap-4">

        <Card>
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">
                {t("totalStaff")}
              </p>

              <h2 className="text-3xl font-bold">
                {totalStaff}
              </h2>
            </div>

            <Users className="text-orange-500" />
          </div>
        </Card>

        <Card>
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">
                {t("veterinarians")}
              </p>

              <h2 className="text-3xl font-bold">
                {vets}
              </h2>
            </div>

            <Stethoscope className="text-blue-500" />
          </div>
        </Card>

        <Card>
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">
                {t("active")}
              </p>

              <h2 className="text-3xl font-bold">
                {activeUsers}
              </h2>
            </div>

            <UserCheck className="text-green-500" />
          </div>
        </Card>

        <Card>
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">
                {t("admins")}
              </p>

              <h2 className="text-3xl font-bold">
                {admins}
              </h2>
            </div>

            <Shield className="text-red-500" />
          </div>
        </Card>

      </div>

      <Card>

        <div dir={ ["ar", "ku"].includes(i18n.language)
                         ? "rtl"
                        : "ltr"
                        } className="flex flex-wrap gap-3 items-center">

          <div className="relative flex-1">

            <Search
              size={18}
              className="absolute left-3 top-4 text-gray-400"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder={t("searchStaff")}
              className="
                w-full
                rounded-2xl
                border
                border-gray-200
                pl-10
                px-4
                py-3
              "
            />

          </div>


          <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="
                rounded-2xl
                border
                border-gray-200
                px-4
                py-3
                min-w-[180px]
                bg-white
              "
            >
              <option value="All">{t("allRoles")}</option>
              <option value="Admin">{t("admin")}</option>
              <option value="Veterinarian">{t("veterinarian")}</option>
              <option value="Manager">{t("manager")}</option>
              <option value="Employee">{t("employee")}</option>
              <option value="Volunteer">{t("volunteer")}</option>
            </select>

          <Button
            onClick={() => {
              resetForm();
              setOpenModal(true);
            }}
          >
            <UserPlus size={18} />
            {t("addStaff")}
          </Button>

        </div>

      </Card>

      <Card>

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead>

              <tr className="border-b">

                <th className="text-left p-3">
                  {t("name")}
                </th>

                <th className="text-left p-3">
                  {t("username")}
                </th>

                <th className="text-left p-3">
                  {t("role")}
                </th>

                <th className="text-left p-3">
                  {t("position")}
                </th>

                <th className="text-left p-3">
                  {t("salary")}
                </th>

                <th className="text-left p-3">
                  {t("phone")}
                </th>

                <th className="text-left p-3">
                  {t("status")}
                </th>

                <th className="text-left p-3">
                  {t("action")}
                </th>

              </tr>

            </thead>

            <tbody>

              {filteredUsers.map(
                (user) => (

                  <tr
                    key={user.id}
                    className="border-b"
                  >

                    <td className="p-3 font-medium">
                      {
                        user.first_name
                      }{" "}
                      {
                        user.last_name
                      }
                    </td>

                    <td className="p-3">
                      {
                        user.username
                      }
                    </td>

                    <td className="p-3">

                      <span
                        className={`
                        px-3
                        py-1
                        rounded-full
                        text-xs
                        font-semibold
                        ${roleBadge(
                          user.role
                        )}
                      `}
                      >
                        {user.role}
                      </span>

                    </td>

                    <td className="p-3">
                      {
                        user.position
                      }
                    </td>

                    <td className="p-3">
                      {formatIQD(user.salary)} IQD
                    </td>

                    <td className="p-3">
                      {user.phone}
                    </td>

                    <td className="p-3">

                      <span
                        className={`
                        px-3
                        py-1
                        rounded-full
                        text-xs
                        font-semibold
                        ${
                          user.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }
                      `}
                      >
                        {user.is_active
                          ? t("active")
                          : t("inactive")}
                      </span>

                    </td>

                    <td className="p-3">

                      <div className="flex gap-2">

                        <button
                          onClick={() =>
                            handleEdit(
                              user
                            )
                          }
                          className="
                          p-2
                          rounded-xl
                          bg-blue-100
                          text-blue-600
                        "
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(
                              user.id
                            )
                          }
                          className="
                          p-2
                          rounded-xl
                          bg-red-100
                          text-red-600
                        "
                        >
                          <Trash2 size={16} />
                        </button>

                      </div>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      </Card>



      <Card>

        <div dir={ ["ar", "ku"].includes(i18n.language)
                         ? "rtl"
                        : "ltr"
                        } className="flex items-center gap-2 mb-5">
          <Shield className="text-orange-500" size={22} />
          <div>
            <h2 className="text-xl font-bold">
              {t("passwordManagement")}
            </h2>
            <p className="text-sm text-gray-500">
              {t("passwordManagementDescription")}
            </p>
          </div>
        </div>

        <div dir={ ["ar", "ku"].includes(i18n.language)
                         ? "rtl"
                        : "ltr"
                        } className="grid md:grid-cols-2 gap-5">

          <div>
            <label className="block mb-2 font-medium">
              {t("staffMember")}
            </label>

            <select
              value={passwordUser}
              onChange={(e) =>
                setPasswordUser(e.target.value)
              }
              className="
                w-full
                rounded-xl
                border
                border-gray-200
                px-4
                py-3
              "
            >
              <option value="">
                {t("selectStaff")}
              </option>

              {users.map((u) => (
                <option
                  key={u.id}
                  value={u.id}
                >
                  {u.first_name} {u.last_name} ({u.username})
                </option>
              ))}
            </select>
          </div>

          <Input
            type="password"
            label={t("newPassword")}
            value={newPassword}
            onChange={(e) =>
              setNewPassword(e.target.value)
            }
          />

          <Input
            type="password"
            label={t("confirmPassword")}
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(e.target.value)
            }
          />

        </div>

        <div className="flex justify-end mt-6">

          <Button
            onClick={handlePasswordChange}
          >
            <Shield size={18} />
            {t("resetPassword")}
          </Button>

        </div>

      </Card>


      <Modal
        open={openModal}
        onClose={() =>
          setOpenModal(false)
        }
        title={
          editingUser
            ? t("addStaff")
            : t("addStaff")
        }
      >

        <div dir={ ["ar", "ku"].includes(i18n.language)
                         ? "rtl"
                        : "ltr"
                        } className="grid md:grid-cols-2 gap-4">

          <Input
            label={t("firstname")}
            value={form.first_name}
            onChange={(e) =>
              setForm({
                ...form,
                first_name:
                  e.target.value,
              })
            }
          />

          <Input
            label={t("lastname")}
            value={form.last_name}
            onChange={(e) =>
              setForm({
                ...form,
                last_name:
                  e.target.value,
              })
            }
          />

          <Input
            label={t("username")}
            value={form.username}
            onChange={(e) =>
              setForm({
                ...form,
                username:
                  e.target.value,
              })
            }
          />

          {!editingUser && (
            <Input
              type="password"
              label={t("password")}
              value={form.password}
              onChange={(e) =>
                setForm({
                  ...form,
                  password:
                    e.target.value,
                })
              }
            />
          )}

          <Input
            label={t("position")}
            value={form.position}
            onChange={(e) =>
              setForm({
                ...form,
                position:
                  e.target.value,
              })
            }
          />

          <Input
            label={t("phone")}
            value={form.phone}
            onChange={(e) =>
              setForm({
                ...form,
                phone:
                  e.target.value,
              })
            }
          />

          <Input
            label={t("email")}
            value={form.email}
            onChange={(e) =>
              setForm({
                ...form,
                email:
                  e.target.value,
              })
            }
          />


          <Input
            type="number"
            label={t("salary")}
            value={form.salary}
            onChange={(e) =>
              setForm({
                ...form,
                salary: e.target.value,
              })
            }
          />

          <div>
            <label className="font-medium text-gray-700">
              {t("role")}
            </label>

            <select
              value={form.role}
              onChange={(e) =>
                setForm({
                  ...form,
                  role:
                    e.target.value,
                })
              }
              className="
                mt-2
                w-full
                rounded-2xl
                border
                border-gray-200
                px-4
                py-3
              "
            >
              <option>
                {t("admin")}
              </option>

              <option>
                {t("veterinarian")}
              </option>

              <option>
                {t("manager")}
              </option>

              <option>
                {t("employee")}
              </option>

              <option>
                {t("volunteer")}
              </option>
            </select>
          </div>

        </div>

        <div className="mt-5">

          <label className="flex items-center gap-3">

            <input
              type="checkbox"
              checked={
                form.is_active
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  is_active:
                    e.target.checked,
                })
              }
            />

            {t("activeUser")}

          </label>

        </div>

        <div className="flex justify-end mt-6">

          <Button
            onClick={
              handleSubmit
            }
          >
            {t("save")}
          </Button>

        </div>

      </Modal>

    </div>
  );
}