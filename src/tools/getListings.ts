import { z } from 'zod';
import { supabase } from '../db/supabase.js';

// Input validation schema
const GetListingsSchema = z.object({
  zip_code: z.string().regex(/^\d{5}$/, 'Invalid ZIP code format (must be 5 digits)'),
  dietary_restrictions: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
  limit: z.number().int().min(1).max(10).default(3),
});

// Output schema
export interface ListingOutput {
  listing_id: string;
  restaurant_name: string;
  restaurant_address: string;
  item_name: string;
  description: string | null;
  original_price: number;
  discounted_price: number;
  quantity_available: number;
  pickup_deadline: string;
  dietary_tags: string[];
}

export interface GetListingsOutput {
  listings: ListingOutput[];
  count: number;
}

export async function getListings(args: any): Promise<GetListingsOutput> {
  // Validate input
  const validated = GetListingsSchema.parse(args);
  const { zip_code, dietary_restrictions, allergies, limit } = validated;

  console.log('================ GET LISTINGS START ================');
  console.log('GET LISTINGS INPUT:', JSON.stringify(validated, null, 2));
  console.log('CURRENT SERVER TIME:', new Date().toISOString());

  // 1. Find restaurants in the ZIP code
  const { data: restaurants, error: rError } = await supabase
    .from('restaurants')
    .select('id, name, address, zip_code')
    .eq('zip_code', zip_code);

  console.log('RESTAURANTS QUERY RESULT:', JSON.stringify(restaurants, null, 2));
  console.log('RESTAURANTS QUERY ERROR:', rError);

  if (rError) {
    throw new Error(`Database error (restaurants): ${rError.message}`);
  }

  if (!restaurants || restaurants.length === 0) {
    console.log(`NO RESTAURANTS FOUND FOR ZIP ${zip_code}`);
    console.log('================ GET LISTINGS END ==================');
    return { listings: [], count: 0 };
  }

  const restaurantIds = restaurants.map((r) => r.id);
  console.log('RESTAURANT IDS:', JSON.stringify(restaurantIds, null, 2));

  // DEBUG: fetch all listings for these restaurants without filters first
  const { data: allListingsForRestaurants, error: allListingsError } = await supabase
    .from('listings')
    .select('*')
    .in('restaurant_id', restaurantIds);

  console.log('ALL LISTINGS FOR RESTAURANTS (NO FILTERS):', JSON.stringify(allListingsForRestaurants, null, 2));
  console.log('ALL LISTINGS ERROR:', allListingsError);

  if (allListingsError) {
    throw new Error(`Database error (all listings debug): ${allListingsError.message}`);
  }

  // 2. Fetch listings for those restaurants with active filters
  const nowIso = new Date().toISOString();

  const { data: listings, error } = await supabase
    .from('listings')
    .select('*')
    .in('restaurant_id', restaurantIds)
    .gt('quantity_remaining', 0)
    .gt('pickup_deadline', nowIso)
    .order('discounted_price', { ascending: true })
    .limit(limit);

  console.log('FILTERED LISTINGS QUERY RESULT:', JSON.stringify(listings, null, 2));
  console.log('FILTERED LISTINGS QUERY ERROR:', error);

  if (error) {
    throw new Error(`Database error (filtered listings): ${error.message}`);
  }

  if (!listings || listings.length === 0) {
    console.log('NO LISTINGS AFTER DB FILTERS');
    console.log('Possible causes: quantity_remaining <= 0 OR pickup_deadline is in the past');
    console.log('================ GET LISTINGS END ==================');
    return { listings: [], count: 0 };
  }

  // 3. Filter by dietary restrictions and allergies
  const restaurantMap = new Map(restaurants.map((r) => [r.id, r]));

  const filtered = listings.filter((listing) => {
    const listingTags = listing.dietary_tags || [];
    const listingAllergens = listing.allergen_tags || [];

    console.log('CHECKING LISTING:', JSON.stringify({
      id: listing.id,
      item_name: listing.item_name,
      dietary_tags: listingTags,
      allergen_tags: listingAllergens,
    }, null, 2));

    // Filter out if any user allergies are in listing allergens
    if (allergies.length > 0) {
      const hasAllergen = allergies.some((allergy) =>
        listingAllergens.some((tag: string) =>
          tag.toLowerCase().includes(allergy.toLowerCase())
        )
      );

      if (hasAllergen) {
        console.log(`LISTING EXCLUDED BY ALLERGY FILTER: ${listing.id}`);
        return false;
      }
    }

    // If user has dietary restrictions, check if listing matches
    if (dietary_restrictions.length > 0) {
      const matchesDiet = dietary_restrictions.some((diet) =>
        listingTags.some((tag: string) =>
          tag.toLowerCase().includes(diet.toLowerCase())
        )
      );

      // Only include listings that match at least one dietary requirement
      // OR have no dietary tags (neutral items)
      if (!matchesDiet && listingTags.length > 0) {
        console.log(`LISTING EXCLUDED BY DIET FILTER: ${listing.id}`);
        return false;
      }
    }

    return true;
  });

  console.log('LISTINGS AFTER APP FILTERS:', JSON.stringify(filtered, null, 2));

  // 4. Format response
  const formatted: ListingOutput[] = filtered.map((listing) => {
    const restaurant = restaurantMap.get(listing.restaurant_id);

    return {
      listing_id: listing.id,
      restaurant_name: restaurant?.name || 'Unknown',
      restaurant_address: restaurant?.address || 'Unknown',
      item_name: listing.item_name,
      description: listing.description,
      original_price: Number(listing.original_price),
      discounted_price: Number(listing.discounted_price),
      quantity_available: listing.quantity_remaining,
      pickup_deadline: listing.pickup_deadline,
      dietary_tags: listing.dietary_tags || [],
    };
  });

  console.log('FINAL FORMATTED LISTINGS:', JSON.stringify(formatted, null, 2));
  console.log('================ GET LISTINGS END ==================');

  return {
    listings: formatted,
    count: formatted.length,
  };
}