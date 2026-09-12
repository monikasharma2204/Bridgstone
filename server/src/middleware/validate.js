'use strict';

const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');


function requireObjectBody(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw ApiError.badRequest('Request body must be a JSON object');
  }
  return body;
}

function requireObjectId(value, field = 'id') {
  if (value === undefined || value === null || value === '') {
    throw ApiError.badRequest(`${field} is required`);
  }
  if (typeof value !== 'string') {
    throw ApiError.badRequest(`${field} must be a string`);
  }
  if (!mongoose.Types.ObjectId.isValid(value) || String(new mongoose.Types.ObjectId(value)) !== value) {
    throw ApiError.badRequest(`${field} must be a valid MongoDB ObjectId`);
  }
  return value;
}


function requireEnum(value, allowed, field) {
  if (value === undefined || value === null || value === '') {
    throw ApiError.badRequest(`${field} is required`);
  }
  if (typeof value !== 'string') {
    throw ApiError.badRequest(`${field} must be a string`);
  }
  const normalised = value.trim().toLowerCase();
  if (!allowed.includes(normalised)) {
    throw ApiError.badRequest(`${field} must be one of: ${allowed.join(', ')}`);
  }
  return normalised;
}


function optionalString(value, field, maxLength = 128) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') {
    throw ApiError.badRequest(`${field} must be a string`);
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > maxLength) {
    throw ApiError.badRequest(`${field} must be at most ${maxLength} characters`);
  }
  return trimmed;
}


function parseIntParam(value, { fallback, min, max, field }) {
  if (value === undefined || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw ApiError.badRequest(`${field} must be an integer`);
  }
  if (parsed < min || parsed > max) {
    throw ApiError.badRequest(`${field} must be between ${min} and ${max}`);
  }
  return parsed;
}


function resolveUserId(req, bodyUserId) {
  const fromBody = optionalString(bodyUserId, 'userId', 128);
  if (fromBody) return fromBody;

  const ip = req.ip || req.socket?.remoteAddress || '';
  if (!ip) {
    throw ApiError.badRequest('userId is required (no client IP available to fall back on)');
  }
  return `ip:${ip}`;
}

module.exports = {
  requireObjectBody,
  requireObjectId,
  requireEnum,
  optionalString,
  parseIntParam,
  resolveUserId,
};
