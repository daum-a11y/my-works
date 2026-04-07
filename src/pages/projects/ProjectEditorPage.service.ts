export function splitServiceGroupName(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return {
      serviceGroup: '',
      serviceName: '',
    };
  }

  const separator = normalized.indexOf(' / ');
  if (separator < 0) {
    return {
      serviceGroup: normalized,
      serviceName: '',
    };
  }

  return {
    serviceGroup: normalized.slice(0, separator),
    serviceName: normalized.slice(separator + 3),
  };
}
