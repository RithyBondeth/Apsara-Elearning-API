import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

/** Matches `id`, `userId`, `courseId`, … — the shape every route id param takes. */
const ID_PARAM = /^(id|[a-z][A-Za-z0-9]*Id)$/;

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Rejects malformed ids at the edge, as a 400 rather than the 500 Postgres
 * throws when an unparseable uuid reaches a `where id = $1`.
 *
 * Applied globally, so it covers every route without each controller having to
 * remember `ParseUUIDPipe` — only params whose *name* looks like an id are
 * checked, leaving slugs and other string params untouched.
 */
@Injectable()
export class UuidParamPipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    if (metadata.type !== 'param') return value;

    const name = metadata.data;
    if (!name || !ID_PARAM.test(name)) return value;
    if (typeof value !== 'string' || !UUID.test(value)) {
      throw new BadRequestException(`${name} must be a UUID`);
    }

    return value;
  }
}
