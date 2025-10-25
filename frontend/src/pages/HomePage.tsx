import { useState, useEffect } from "react";
import { Package, Campaign } from "../types/product";
import productService from "../services/productService";
import Hero from "../components/homepage/Hero";
import PackagesSection from "../components/homepage/PackagesSection";
import CampaignsSection from "../components/homepage/CampaignsSection";
import LoadingState from "../components/homepage/LoadingState";
import ErrorState from "../components/homepage/ErrorState";
import EmptyState from "../components/homepage/EmptyState";

const HomePage = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const [packagesData, campaignsData] = await Promise.all([
        productService.getPackages(),
        productService.getCampaigns(),
      ]);
      setPackages(packagesData);
      setCampaigns(campaignsData);
    } catch (err: any) {
      setError("Failed to load products. Please try again.");
      console.error("Error loading products:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Hero />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 w-full">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <>
            <PackagesSection packages={packages} />
            <CampaignsSection campaigns={campaigns} />

            {packages.length === 0 && campaigns.length === 0 && <EmptyState />}
          </>
        )}
      </div>
    </>
  );
};

export default HomePage;
