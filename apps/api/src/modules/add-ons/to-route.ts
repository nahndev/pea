import { ID_PLACEHOLDER, ID_SEGMENT } from './add-ons.constants';

/** Path of a url without query string, numeric and uuid segments as `{id}` */
export const toRoute = (url: string): string => {
  const [path] = url.split('?');
  const route = path
    .split('/')
    .map((segment) => (ID_SEGMENT.test(segment) ? ID_PLACEHOLDER : segment))
    .join('/');
  return route || '/';
};
