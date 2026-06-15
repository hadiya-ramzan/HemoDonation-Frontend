import { useEffect, useRef, useState } from "react";

const kasurCities = [
  "Abbas Pura Roday",
  "Allahabad",
  "Alpa Sadhari",
  "Atari Akaki",
  "Babliana Otar",
  "Bahadurpura",
  "Bazidpur",
  "Bedian Kalan",
  "Beharwal Kalan",
  "Bheela Hithar",
  "Bhemkie",
  "Bhagiwal",
  "Bhamba Hithar",
  "Bhamba Kalan",
  "Bhoe Asal",
  "Bonga Kahan Singh",
  "Burj Mahlam",
  "Chak 66 Dina Nath",
  "Chak No. 1",
  "Chak No. 3",
  "Chak No. 4 Kamoki",
  "Chak No. 7",
  "Chak No. 9",
  "Chak No. 13",
  "Chak No. 14",
  "Chak No. 18",
  "Chak No. 19",
  "Chak No. 22",
  "Chak No. 23",
  "Chak No. 26",
  "Chak No. 28",
  "Chak No. 31",
  "Chak No. 32",
  "Chak No. 33",
  "Chak No. 34",
  "Chak No. 35",
  "Chak No. 39",
  "Chak No. 45 Padhana",
  "Chak No. 64",
  "Chak No. 68",
  "Changa Manga",
  "Charkey",
  "Chathiyan Wala",
  "Cheena Arla",
  "Chunian",
  "Daftuh",
  "Deo Sial",
  "Dholan Hithar",
  "Dhose",
  "Dhuttay",
  "Due Key",
  "Ellahabad",
  "Fatehpur",
  "Ganda Singh Wala",
  "Gauhar Jageer",
  "Gehlan Hithar",
  "Ghallan",
  "Ghandi Utar",
  "Ghummankay",
  "Gid Pur",
  "Gillan Wala",
  "Goher Punchan",
  "Gulzar Jageer",
  "Habib Abad",
  "Halla",
  "Hanjrai Kalan",
  "Hari Pur",
  "Hindal",
  "Hussain Khan Wala",
  "Ibrahimabad",
  "Jagowala",
  "Jajjal",
  "Jamber Khurd",
  "Jambar",
  "Jamsher Kalan",
  "Jandwala",
  "Kandu Khara",
  "Kanganpur",
  "Kanween",
  "Kasur",
  "Khankay Mor",
  "Khudian",
  "Kot Baba Ajgar Singh",
  "Kot Haashim Baig",
  "Kot Nazir Bhatti",
  "Kot Radha Kishan",
  "Kot Sandrus",
  "Kot Sardar Khan",
  "Kot Siddique",
  "Kot Wasan Singh",
  "Kotha",
  "Kull",
  "Lambey Jagir",
  "Lunday",
  "Mali Wal",
  "Mandian Wala",
  "Maujoki",
  "Mian Wali Ghat",
  "Mokal",
  "Moola Pur",
  "Mundayki",
  "Mustafabad",
  "Narroki Mahja",
  "Nathay Khalisa",
  "Noorpur",
  "Pemmar",
  "Phool Nagar",
  "Phulliani",
  "Pattoki",
  "Pattoki Kohna",
  "Pial Kalan",
  "Qadiwind",
  "Raja Jang",
  "Rakh Chak",
  "Rao Khan Wala",
  "Rosa Tiba",
  "Rukan Pura",
  "Sadha Otar",
  "Sarai Naushehra",
  "Sarhali Kalan",
  "Sattoki Hithar",
  "Shaikham",
  "Shery Wala",
  "Talwandi Chraigh",
  "Theh Kailay",
  "Triday Wala",
  "Umme Pur",
  "Usman Wala",
  "Wan Aadhan",
  "Wan Khara",
];

function CityDropdown({
  value,
  onChange,
  placeholder = "Search City",
  variant = "dark",
}) {
  const wrapperRef = useRef(null);

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filteredCities = kasurCities.filter((city) =>
    city.toLowerCase().includes(search.toLowerCase())
  );

  const isDark = variant === "dark";

  const inputClass = isDark
    ? "w-full bg-[#111620] border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-400 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/40"
    : "w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-black placeholder:text-slate-500 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/40";

  const dropdownClass = isDark
    ? "absolute z-50 mt-1 w-full max-h-44 overflow-y-auto bg-[#111620] border border-slate-700 rounded-xl shadow-lg text-white"
    : "absolute z-50 mt-1 w-full max-h-44 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg text-black";

  const optionClass = isDark
    ? "px-3 py-2 text-sm hover:bg-[#1d222c] cursor-pointer"
    : "px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer";

  const inputValue = open ? search : value || "";

  const handleInputChange = (e) => {
    const val = e.target.value;

    setSearch(val);
    setOpen(true);

    onChange(val);
  };

  const handleSelectCity = (city) => {
    setSearch("");
    setOpen(false);

    onChange(city);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        type="text"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setOpen(true)}
        className={inputClass}
        autoComplete="off"
      />

      {open && (
        <div className={dropdownClass}>
          {filteredCities.length > 0 ? (
            filteredCities.map((city) => (
              <div
                key={city}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelectCity(city)}
                className={optionClass}
              >
                {city}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-slate-400">
              No city found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CityDropdown;