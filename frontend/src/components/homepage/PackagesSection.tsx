import { Package } from "../../types/product";
import ProductCard from "../ProductCard";
import EnhancedProductCard from "../EnhancedProductCard";

interface PackagesSectionProps {
  packages: Package[];
}

const PackagesSection = ({ packages }: PackagesSectionProps) => {
  if (packages.length === 0) {
    return null;
  }

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Campaign Packages
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) =>
          pkg.images && pkg.images.length > 0 ? (
            <EnhancedProductCard key={`package-${pkg.id}`} product={pkg} />
          ) : (
            <ProductCard key={`package-${pkg.id}`} product={pkg} />
          )
        )}
      </div>
    </section>
  );
};

export default PackagesSection;
