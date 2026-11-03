import { createHash } from 'node:crypto';
import type { SubjectType } from '@tomato/constants';
import type { SubjectView } from '@tomato/types';
import type { Subject } from '../../generated/client';
import { SUBJECT_UUID_NAMESPACE } from './subjects.constants';

export interface SubjectSource {
  type: SubjectType;
  uuid: string;
  description: string;
}

const uuidV5 = (name: string, namespace: string): string => {
  const bytes = createHash('sha1')
    .update(Buffer.from(namespace.replaceAll('-', ''), 'hex'))
    .update(name)
    .digest()
    .subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

export const createSubject = (type: SubjectType, description: string): SubjectSource => ({
  type,
  uuid: uuidV5(`${type}:${description}`, SUBJECT_UUID_NAMESPACE),
  description,
});

export const toSubjectView = ({ uuid, type, description }: Subject): SubjectView => ({
  uuid,
  type: type as SubjectType,
  description,
});
