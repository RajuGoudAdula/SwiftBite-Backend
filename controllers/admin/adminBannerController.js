const Canteen = require("../../models/Canteen");
const Banner = require("../../models/HeroBanner");


const getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find();
    res.status(200).json(banners);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch banners", error });
  }
};

const addHeroBanner = async (req, res) => {
    try {
      const {
        type,
        title,
        subtitle,
        description,
        media,
        cta,
        isActive,
        personalizationTags,
        targetCanteens,
        schedule,
        displayRules,
        createdBy,
      } = req.body;
  
      // Validate required fields
      if (
        !title ||
        !media?.imageUrl ||
        !schedule?.startDate ||
        !schedule?.endDate ||
        !subtitle ||
        !description 
      ) {
        return res.status(400).json({ message: "Required fields are missing" });
      }
  
      const newBanner = new Banner({
        type,
        title,
        subtitle,
        description,
        media: {
          imageUrl: media.imageUrl,
          mobileImageUrl: media.mobileImageUrl,
          videoUrl: media.videoUrl,
          altText: media.altText,
        },
        cta: {
          text: cta?.text,
          link: cta?.link,
          type: cta?.type || 'internal',
          trackClick: cta?.trackClick ?? true,
        },
        isActive: isActive ?? true,
        personalizationTags: personalizationTags || ['all'],
        targetCanteens: targetCanteens || [],
        schedule: {
          startDate: schedule.startDate,
          endDate: schedule.endDate,
          timeZone: schedule.timeZone || 'UTC',
        },
        displayRules: {
          platforms: displayRules?.platforms || ['web', 'mobile'],
          maxImpressionsPerUser: displayRules?.maxImpressionsPerUser ?? 5,
        },
        createdBy:createdBy, 
      });
  
      const savedBanner = await newBanner.save();
      res.status(201).json(savedBanner);
    } catch (error) {
      console.error("Error adding hero banner:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };


const updateBanner = async (req, res) => {
  const { bannerId } = req.params;
  const {
    type,
    title,
    subtitle,
    description,
    media,
    cta,
    isActive,
    personalizationTags,
    targetCanteens,
    schedule,
    displayRules,
    createdBy,
  } = req.body;


  try {
    const banner = await Banner.findById(bannerId);

    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    banner.type = type || banner.type;
    banner.title = title || banner.title;
    banner.subtitle = subtitle || banner.subtitle;
    banner.description = description || banner.description;
    banner.media = media || banner.media;
    banner.cta = cta || banner.cta;
    banner.isActive = isActive || banner.isActive;
    banner.personalizationTags = personalizationTags || banner.personalizationTags;
    banner.targetCanteens = targetCanteens || banner.targetCanteens;
    banner.schedule = schedule || banner.schedule;
    banner.displayRules = displayRules || banner.displayRules;
    banner.createdBy = createdBy || banner.createdBy;

    const updatedBanner = await banner.save();
    res.status(200).json(updatedBanner);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to update banner", error });
  }
};


const deleteBanner = async (req, res) => {
  const { bannerId } = req.params;

  try {
    const banner = await Banner.findById(bannerId);

    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    await banner.deleteOne();
    res.status(200).json({ message: "Banner deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete banner", error });
  }
};

const fetchCanteens = async (req,res) => {
    try{
        const canteens = await Canteen.find()
                                .select("name collegeId")
                                .populate("collegeId", "name");
        if(!canteens){
            return res.status(404).json({ message: "Canteens not found" });
        }

        res.status(200).json({message : "Canteens for banner",canteens});

    }catch(error){
        res.status(500).json({ message: "Failed to fetch canteens for banner", error });
    }
}

module.exports = {
  getAllBanners,
  addHeroBanner,
  updateBanner,
  deleteBanner,
  fetchCanteens,
};
