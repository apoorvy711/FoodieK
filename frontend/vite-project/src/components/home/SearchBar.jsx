import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import "./home.css";

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const { data } = await api.get("/food", {
          params: {
            search: query.trim(),
          },
        });

        setSuggestions(data.foodItems || []);
      } catch (error) {
        setSuggestions([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const normalizedSuggestions = useMemo(
    () => suggestions.slice(0, 4),
    [suggestions],
  );

  const handleSearch = (value = query) => {
    onSearch?.(value.trim());
  };

  return (
    <div className="search-container">
      <div className="search-box">
        <input
          type="text"
          placeholder="Search foods, restaurants..."
          className="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
        />

        <button
          type="button"
          className="search-submit"
          onClick={() => handleSearch()}
        >
          Search
        </button>
      </div>

      {normalizedSuggestions.length > 0 && (
        <div className="search-suggestions">
          {normalizedSuggestions.map((item) => (
            <button
              key={item._id}
              type="button"
              className="search-suggestion"
              onClick={() => {
                setSuggestions([]);
                navigate(`/food/${item._id}`);
              }}
            >
              <span>{item.name}</span>
              <small>
                {item.restaurantName || item.foodPartner?.name || "FoodieK"}
              </small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
