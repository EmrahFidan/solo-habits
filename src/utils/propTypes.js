// PropTypes tanımlamaları - React built-in prop-types kullanımı
// Bu dosya prop validation için custom validators içerir

export const validateUser = (props, propName, componentName) => {
  const user = props[propName];
  
  if (user == null) {
    return null; // prop opsiyonel
  }
  
  if (typeof user !== 'object') {
    return new Error(
      `Invalid prop \`${propName}\` of type \`${typeof user}\` supplied to \`${componentName}\`, expected \`object\`.`
    );
  }
  
  // User object gerekli alanları kontrol et
  const requiredFields = ['uid', 'email'];
  for (const field of requiredFields) {
    if (!user[field]) {
      return new Error(
        `Invalid prop \`${propName}\` supplied to \`${componentName}\`. Missing required field: \`${field}\`.`
      );
    }
  }
  
  return null;
};

export const validateUserData = (props, propName, componentName) => {
  const userData = props[propName];
  
  if (userData == null) {
    return null; // prop opsiyonel
  }
  
  if (typeof userData !== 'object') {
    return new Error(
      `Invalid prop \`${propName}\` of type \`${typeof userData}\` supplied to \`${componentName}\`, expected \`object\`.`
    );
  }
  
  return null;
};

export const validateChallenge = (props, propName, componentName) => {
  const challenge = props[propName];
  
  if (challenge == null) {
    return new Error(
      `The prop \`${propName}\` is marked as required in \`${componentName}\`, but its value is \`${challenge}\`.`
    );
  }
  
  if (typeof challenge !== 'object') {
    return new Error(
      `Invalid prop \`${propName}\` of type \`${typeof challenge}\` supplied to \`${componentName}\`, expected \`object\`.`
    );
  }
  
  // Challenge object gerekli alanları kontrol et
  const requiredFields = ['id', 'name', 'startDate'];
  for (const field of requiredFields) {
    if (!challenge[field]) {
      return new Error(
        `Invalid prop \`${propName}\` supplied to \`${componentName}\`. Missing required field: \`${field}\`.`
      );
    }
  }
  
  return null;
};

export const validateFunction = (props, propName, componentName) => {
  const func = props[propName];
  
  if (func == null) {
    return new Error(
      `The prop \`${propName}\` is marked as required in \`${componentName}\`, but its value is \`${func}\`.`
    );
  }
  
  if (typeof func !== 'function') {
    return new Error(
      `Invalid prop \`${propName}\` of type \`${typeof func}\` supplied to \`${componentName}\`, expected \`function\`.`
    );
  }
  
  return null;
};

export const validateTabId = (props, propName, componentName) => {
  const tabId = props[propName];
  
  if (typeof tabId !== 'number') {
    return new Error(
      `Invalid prop \`${propName}\` of type \`${typeof tabId}\` supplied to \`${componentName}\`, expected \`number\`.`
    );
  }
  
  // Tab ID 0-3 arasında olmalı
  if (tabId < 0 || tabId > 3) {
    return new Error(
      `Invalid prop \`${propName}\` supplied to \`${componentName}\`. Expected value between 0-3, got ${tabId}.`
    );
  }
  
  return null;
};