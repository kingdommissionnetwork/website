import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description?: string;
  image?: string;
  url?: string;
}

const SITE_NAME = "Kingdom Missions Network";
const DEFAULT_DESC = "Official Kingdom Missions Network platform. Connecting Christian believers worldwide through a 24/7 interactive prayer wall, daily scripture in 22 translations, live sermons, events, and kingdom partnership.";

export default function SEO({ title, description, image, url }: SEOProps) {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const desc = description || DEFAULT_DESC;
  const img = image ? (image.startsWith("http") ? image : `https://kingdommissionsnetwork.org${image}`) : "https://kingdommissionsnetwork.org/logo.png";
  const href = url ? (url.startsWith("http") ? url : `https://kingdommissionsnetwork.org${url}`) : "https://kingdommissionsnetwork.org";

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={href} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={img} />
      <meta property="og:image:secure_url" content={img} />
      <meta property="og:image:width" content="512" />
      <meta property="og:image:height" content="512" />
      <meta property="og:image:alt" content="Kingdom Missions Network Official Logo" />
      <meta property="og:url" content={href} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />
    </Helmet>
  );
}
