import Card from "./ui/Card";
import Modal from "./ui/Modal";
import { useTranslation } from "react-i18next";
export default function ProcedureDetailsModal({
  open,
  onClose,
  procedure,
}) {
  if (!procedure) return null;
const { t, i18n } = useTranslation();
  return (
    <Modal 
      open={open}
      onClose={onClose}
      title={t("procedureDetails")}
    >
      <div  className="space-y-6">
        <div dir={ ["ar", "ku"].includes(i18n.language)
                         ? "rtl"
                        : "ltr"
                        } >
        <Card className="bg-orange-50 border-orange-200">

          <div className="space-y-2">

            <h2 className="text-2xl font-bold text-orange-700">
              {procedure.dog_id}
            </h2>

            <p className="text-lg font-semibold">
              {
                procedure.procedure_type
              }
            </p>

            <p className="text-gray-600">
              {
                procedure.veterinarian_name
              }
            </p>

          </div>

        </Card>

        <Card title={t("procedureInformation")}>

          <div className="grid md:grid-cols-3 gap-4">

            <div>
              <p className="text-gray-500">
                {t("dates")}
              </p>

              <p className="font-semibold">
                {
                  <td className="p-3">
                  {new Date(procedure.procedure_date).toLocaleDateString()}
                  </td>
                  
                }
              </p>
            </div>

            <div>
              <p className="text-gray-500">
                {t("status")}
              </p>

              <span
                className={`
                  inline-flex
                  rounded-full
                  px-3
                  py-1
                  text-xs
                  font-bold
                  ${
                    procedure.surgery_successful
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }
                `}
              >
                {procedure.surgery_successful
                  ? t("successful")
                  : t("failed")}
              </span>
            </div>

          </div>

        </Card>

        <Card title={t("note")}>

          <p className="whitespace-pre-wrap">
            {procedure.notes ||
              t("noNotesProvided")}
          </p>

        </Card>

        </div>
        <Card  title={t("inventoryUsed")}>
              
  {procedure.items?.length ? (

    <div className="overflow-hidden rounded-2xl border border-orange-100">

      <table className="w-full">

        <thead>
          <tr className="bg-orange-500 text-white">
            <th className="px-4 py-3 text-left">
              {t("item")}
            </th>

            <th className="px-4 py-3 text-center">
              {t("quantityUsed")}
            </th>
          </tr>
        </thead>

        <tbody>

          {procedure.items.map(
            (item, index) => (

              <tr
                key={index}
                className="border-t"
              >
                <td className="px-4 py-3">
                  {item.name}
                </td>

                <td className="px-4 py-3 text-center font-bold text-orange-600">
                  {Number(item.quantity_used)}
                </td>
              </tr>

            )
          )}

        </tbody>

      </table>

    </div>

  ) : (

    <p className="text-gray-500">
      {t("noInventoryItemsRecorded")}
    </p>

  )}

</Card>

      </div>
    </Modal>
  );
}