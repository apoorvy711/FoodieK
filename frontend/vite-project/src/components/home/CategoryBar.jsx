import "./home.css";

const CategoryBar = ({ categories, selectedCategory, setSelectedCategory }) => {
  return (
    <div className="category-container">
      <button
        className={`category-chip ${
          selectedCategory === "" ? "active-category" : ""
        }`}
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
          onClick={() => setSelectedCategory(category._id)}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
};

export default CategoryBar;
