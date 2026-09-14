import i18n from "../../i18n";
export default function LanguageSwitcher() {

    return (

        <select

            className="text-black rounded px-2 py-1"

            onChange={(e) => i18n.changeLanguage(e.target.value)}

            defaultValue={i18n.language}

        >

            <option value="en">English</option>

            <option value="tr">Türkçe</option>

            <option value="ar">العربية</option>

            <option value="ku">کوردی</option>

        </select>

    );

}