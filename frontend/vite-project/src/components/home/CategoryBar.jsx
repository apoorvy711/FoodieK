import "./home.css";

const CategoryBar = ({ categories, selectedCategory, setSelectedCategory }) => {
  return (
    <div
      className="category-container"
      role="tablist"
      aria-label="Food categories"
    >
      <button
        className={`category-chip ${
          selectedCategory === "" ? "active-category" : ""
        }`}
        role="tab"
        aria-selected={selectedCategory === ""}
        onClick={() => setSelectedCategory("")}
      >
        All
      </button>

      {categories.map((category) => (
        <button
          key={category._id}
          className={`category-chip ${
            selectedCategory === category._id ? "active-category" : ""
          }`}
          role="tab"
          aria-selected={selectedCategory === category._id}
          onClick={() => setSelectedCategory(category._id)}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
};

export default CategoryBar;
