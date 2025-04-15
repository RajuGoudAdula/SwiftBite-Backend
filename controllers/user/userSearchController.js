const CanteenMenuItem = require('../../models/CanteenMenuItem');
const Product = require('../../models/Product'); // Assuming you have a Product model

// @desc    Get popular menu items
// @route   GET /user/menu/popular
// @access  Public
const fetchPopularItems = async (req, res) => {
  try {
    // Get top 10 most ordered items that are available
    const popularItems = await CanteenMenuItem.aggregate([
      {
        $match: {
          isAvailable: true,
          totalOrders: { $gt: 0 } // Only include items that have been ordered at least once
        }
      },
      {
        $sort: { 
          totalOrders: -1, // Sort by most ordered first
          totalRevenue: -1 // Then by highest revenue
        }
      },
      {
        $limit: 10 // Limit to 10 items
      },
      {
        $lookup: {
          from: `product`,
          localField: 'productId',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      {
        $unwind: '$productDetails'
      },
      {
        $lookup: {
          from: 'canteens',
          localField: 'canteenId',
          foreignField: '_id',
          as: 'canteenDetails'
        }
      },
      {
        $unwind: '$canteenDetails'
      },
      {
        $project: {
          _id: 1,
          name: 1,
          price: 1,
          preparationTime: 1,
          deliveryTime: 1,
          offers: 1,
          images: '$productDetails.images',
          canteenId: 1,
          canteenName: '$canteenDetails.name',
          totalOrders: 1,
          totalRevenue: 1
        }
      }
    ]);

    res.json({
      success: true,
      count: popularItems.length,
      data: popularItems
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Search menu items
// @route   GET /user/menu/search
// @access  Public
const debouncedSearch = async (req, res) => {
    try {
      const { q: query } = req.query;
  
      if (!query?.trim()) {
        return res.status(400).json({
          success: false,
          error: "Please provide a search query",
        });
      }
  
      const regex = new RegExp(query, "i");
  
      const searchResults = await CanteenMenuItem.aggregate([
        {
          $match: {
            isAvailable: true,
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        { $unwind: "$productDetails" },
        {
          $lookup: {
            from: "canteens",
            localField: "canteenId",
            foreignField: "_id",
            as: "canteenDetails",
          },
        },
        { $unwind: "$canteenDetails" },
        {
          $match: {
            $or: [
              // From CanteenMenuItem
              { name: { $regex: regex } },
              { "offers.offerType": { $regex: regex } },
              { "offers.discount": { $regex: regex } },
              { "availability.startTime": { $regex: regex } },
              { "availability.endTime": { $regex: regex } },
  
              // From Product
              { "productDetails.name": { $regex: regex } },
              { "productDetails.description": { $regex: regex } },
              { "productDetails.tags": { $elemMatch: { $regex: regex } } },
              { "productDetails.ingredients": { $elemMatch: { $regex: regex } } },
              { "productDetails.allergens": { $elemMatch: { $regex: regex } } },
              { "productDetails.category": { $regex: regex } },
            ]
          }
        },
        {
          $project: {
            _id: 1,
            name: 1,
            price: 1,
            stock: 1,
            preparationTime: 1,
            deliveryTime: 1,
            image: "$productDetails.image",
            canteenName: "$canteenDetails.name",
            description: "$productDetails.description",
            tags: "$productDetails.tags",
            category: "$productDetails.category",
            ingredients: "$productDetails.ingredients",
            allergens: "$productDetails.allergens",
            offerType: "$offers.offerType",
            offerDiscount: "$offers.discount",
            availability: 1
          },
        },
        { $limit: 10 }
      ]);
  
      return res.json({
        success: true,
        count: searchResults.length,
        data: searchResults,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: "Server Error",
      });
    }
  };
  

module.exports = {
  fetchPopularItems,
  debouncedSearch
};