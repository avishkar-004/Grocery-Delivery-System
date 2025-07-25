
const Categories = () => {
  const categories = [
    { icon: "🧂", name: "Spices & Masalas", count: "120+ items" },
    { icon: "🌾", name: "Grains & Flours", count: "85+ items" },
    { icon: "🍛", name: "Pulses & Lentils", count: "65+ items" },
    { icon: "🫙", name: "Oils & Ghee", count: "45+ items" },
    { icon: "🥫", name: "Pickles & Condiments", count: "90+ items" },
    { icon: "🍭", name: "Snacks & Sweets", count: "200+ items" },
    { icon: "🍵", name: "Beverages", count: "150+ items" },
    { icon: "🍽️", name: "Ready-to-Cook / Instant Foods", count: "75+ items" },
    { icon: "🍃", name: "Dry Fruits & Nuts", count: "55+ items" },
    { icon: "🛍️", name: "Pooja & Daily Essentials", count: "110+ items" },
    { icon: "🧴", name: "Miscellaneous / Others", count: "95+ items" }
  ];

  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6">
            <span className="gradient-text">Product Categories</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover fresh groceries across all categories. From spices to beverages, 
            we have everything you need for your kitchen.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <div 
              key={index}
              className="glass-card p-6 hover-lift glow-effect group cursor-pointer"
              style={{animationDelay: `${index * 0.1}s`}}
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {category.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                {category.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {category.count}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
