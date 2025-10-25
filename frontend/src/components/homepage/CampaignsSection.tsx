import { Campaign } from "../../types/product";
import ProductCard from "../ProductCard";
import EnhancedProductCard from "../EnhancedProductCard";

interface CampaignsSectionProps {
  campaigns: Campaign[];
}

const CampaignsSection = ({ campaigns }: CampaignsSectionProps) => {
  if (campaigns.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Individual Campaigns
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((campaign) =>
          campaign.images && campaign.images.length > 0 ? (
            <EnhancedProductCard key={`campaign-${campaign.id}`} product={campaign} />
          ) : (
            <ProductCard key={`campaign-${campaign.id}`} product={campaign} />
          )
        )}
      </div>
    </section>
  );
};

export default CampaignsSection;
