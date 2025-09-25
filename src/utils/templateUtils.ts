// Utility functions for prompt templating

/**
 * Extracts variable names from a text string that are enclosed in double curly braces
 * Example: "Hello {{name}}, your {{product}} is ready!" => ["name", "product"]
 */
export function extractVariables(text: string): string[] {
  const variableRegex = /\{\{([^}]+)\}\}/g;
  const variables: string[] = [];
  let match;
  
  while ((match = variableRegex.exec(text)) !== null) {
    const variableName = match[1].trim();
    if (variableName && !variables.includes(variableName)) {
      variables.push(variableName);
    }
  }
  
  return variables;
}

/**
 * Replaces variables in a template with provided values
 * Example: replaceVariables("Hello {{name}}!", { name: "John" }) => "Hello John!"
 */
export function replaceVariables(template: string, values: Record<string, string>): string {
  let result = template;
  
  Object.entries(values).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    result = result.replace(regex, value);
  });
  
  return result;
}

/**
 * Validates if all variables in a template have corresponding values
 */
export function validateVariables(template: string, values: Record<string, string>): { 
  isValid: boolean; 
  missingVariables: string[] 
} {
  const templateVariables = extractVariables(template);
  const missingVariables = templateVariables.filter(variable => 
    !values[variable] || values[variable].trim() === ''
  );
  
  return {
    isValid: missingVariables.length === 0,
    missingVariables
  };
}