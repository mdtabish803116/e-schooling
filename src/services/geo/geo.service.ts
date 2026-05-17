import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { State } from '../../models/entities/geo/state.entity';
import { District } from '../../models/entities/geo/district.entity';
import { Place } from '../../models/entities/geo/place.entity';
import { CreatePlaceDto } from '../../interfaces/request/geo/create-place.dto';

@Injectable()
export class GeoService {
  constructor(private dataSource: DataSource) {}

  /**
   * Fetch globally accessible master states mapping catalog.
   */
  async listStates() {
    const states = await this.dataSource.getRepository(State).find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
    return { states };
  }

  /**
   * Fetch regional districts bound directly to a target state boundary.
   */
  async listDistricts(stateId: string) {
    const districts = await this.dataSource.getRepository(District).find({
      where: { stateId, isActive: true },
      order: { name: 'ASC' },
    });
    return { districts };
  }

  /**
   * Fetch specific customized cluster places/villages native to the target branch context.
   */
  async listPlaces(schoolId: string, districtId?: string) {
    const whereClause: any = { schoolId, isActive: true };
    if (districtId) {
      whereClause.districtId = districtId;
    }

    const places = await this.dataSource.getRepository(Place).find({
      where: whereClause,
      order: { name: 'ASC' },
    });

    return { places };
  }

  /**
   * Enables specific school owners to map explicit villages, blocks, or city centers
   * bound exclusively to their internal multi-tenant geographic branch records.
   */
  async createPlace(schoolId: string, dto: CreatePlaceDto) {
    const districtRepo = this.dataSource.getRepository(District);
    const district = await districtRepo.findOne({ where: { id: dto.districtId } });

    if (!district) {
      throw new NotFoundException('Specified parent district profile not found');
    }

    const place = new Place();
    place.schoolId = schoolId;
    place.districtId = dto.districtId;
    place.name = dto.name;
    place.pincode = dto.pincode || '';
    place.isActive = true;

    const savedPlace = await this.dataSource.getRepository(Place).save(place);

    return {
      message: 'Customized branch locality created successfully',
      place: savedPlace,
    };
  }
}
