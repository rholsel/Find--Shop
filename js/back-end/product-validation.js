

const ALLOWED_CATEGORIES = ['Alimentation', 'Habillement', 'Services', 'Artisanat'];

function validateProductPayload(productData) {
    const errors = [];

    if (!productData || typeof productData !== 'object' || Array.isArray(productData)) {
        return { isValid: false, errors: ["Format global invalide."] };
    }

    // Validation du Prix (ex: prix > 0)
    if (typeof productData.price !== 'number' || isNaN(productData.price)) {
        errors.push("Le prix doit être un nombre.");
    } else if (productData.price <= 0) {
        errors.push("Le prix doit être strictement supérieur à 0.");
    }

    // Validation du Stock
    if (!Number.isInteger(productData.stock)) {
        errors.push("Le stock doit être un nombre entier.");
    } else if (productData.stock < 0) {
        errors.push("Le stock ne peut pas être négatif.");
    }

    // Validation de la Catégorie
    if (!ALLOWED_CATEGORIES.includes(productData.category)) {
        errors.push("Catégorie invalide.");
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// On exporte la fonction pour que le script de test puisse la charger
export { validateProductPayload };