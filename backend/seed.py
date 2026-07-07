"""Seed script: populate database with admin account and sample factory spaces."""

import sys
import os
from pathlib import Path

# Ensure the backend directory is on sys.path for imports
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.database import SessionLocal, engine, Base
from app.models import Admin, Space
from app.services.auth import hash_password


def seed():
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # ── Admin ──────────────────────────────────────────────────────
        existing_admin = db.query(Admin).filter(Admin.username == "admin").first()
        if existing_admin:
            print("[SKIP] Admin 'admin' already exists.")
        else:
            admin = Admin(
                username="admin",
                password_hash=hash_password("admin123"),
                email="admin@guanglan.com",
            )
            db.add(admin)
            db.commit()
            print("[OK] Admin 'admin' created (password: admin123).")

        # ── Sample factory spaces ──────────────────────────────────────
        existing_count = db.query(Space).count()
        if existing_count > 0:
            print(f"[SKIP] {existing_count} spaces already exist. Skipping seed.")
            return

        spaces = [
            # ── Small (<100㎡) ──────────────────────────────────────────
            Space(
                name="1号精密加工车间",
                area=50.0,
                area_category="small",
                monthly_rent=4500.0,
                yearly_rent=48600.0,
                address="广东省广州市黄埔区开发大道128号A栋1层",
                description="50㎡精密加工车间，适合小型电子元件加工、精密仪器组装等轻工业生产。车间配备独立电表，24小时安保巡逻。",
                floor_height=4.5,
                ground_load=500.0,
                power_capacity=30,
                has_crane=False,
                has_forklift=False,
                floor_material="环氧地坪",
                fire_rating="丙类",
                drainage="自然排水",
                ventilation="机械通风",
                has_office=True,
                parking="地面停车位2个",
                loading_platform=False,
                images="[]",
                status="available",
                is_published=True,
            ),
            Space(
                name="2号研发实验区",
                area=70.0,
                area_category="small",
                monthly_rent=6300.0,
                yearly_rent=68040.0,
                address="广东省广州市黄埔区开发大道128号A栋2层",
                description="70㎡研发实验空间，采光良好，环境安静。适合实验室、研发中心、产品测试等用途。已铺设防静电地板。",
                floor_height=3.8,
                ground_load=400.0,
                power_capacity=20,
                has_crane=False,
                has_forklift=False,
                floor_material="防静电地板",
                fire_rating="丁类",
                drainage="自然排水",
                ventilation="中央空调",
                has_office=True,
                parking="地面停车位1个",
                loading_platform=False,
                images="[]",
                status="available",
                is_published=True,
            ),
            Space(
                name="3号微型组装车间",
                area=90.0,
                area_category="small",
                monthly_rent=8100.0,
                yearly_rent=87480.0,
                address="广东省广州市黄埔区开发大道128号A栋3层",
                description="90㎡微型组装车间，适合小批量电子产品组装、手工制作、检测包装等作业。配套齐全，即租即用。",
                floor_height=4.0,
                ground_load=500.0,
                power_capacity=25,
                has_crane=False,
                has_forklift=False,
                floor_material="金刚砂地坪",
                fire_rating="丙类",
                drainage="自然排水",
                ventilation="机械通风",
                has_office=False,
                parking="地面停车位1个",
                loading_platform=False,
                images="[]",
                status="available",
                is_published=True,
            ),
            # ── Medium (100-500㎡) ──────────────────────────────────────
            Space(
                name="1号标准生产车间",
                area=150.0,
                area_category="medium",
                monthly_rent=12000.0,
                yearly_rent=129600.0,
                address="广东省广州市黄埔区开发大道128号B栋1层",
                description="150㎡标准生产车间，空间方正，利用率高。适合中小型机械加工、零部件生产、包装加工等。配备三相电源。",
                floor_height=5.0,
                ground_load=800.0,
                power_capacity=50,
                has_crane=False,
                has_forklift=True,
                floor_material="金刚砂地坪",
                fire_rating="丙类",
                drainage="地漏排水",
                ventilation="机械通风",
                has_office=True,
                parking="地面停车位2个",
                loading_platform=True,
                images="[]",
                status="available",
                is_published=True,
            ),
            Space(
                name="2号仓储库房",
                area=250.0,
                area_category="medium",
                monthly_rent=17500.0,
                yearly_rent=189000.0,
                address="广东省广州市黄埔区开发大道128号B栋2层",
                description="250㎡仓储库房，层高适中，干燥通风。适合成品存放、原材料仓储、中转物流等用途。配备货梯直达。",
                floor_height=5.5,
                ground_load=1000.0,
                power_capacity=35,
                has_crane=False,
                has_forklift=True,
                floor_material="水泥地坪",
                fire_rating="丙类",
                drainage="地漏排水",
                ventilation="自然通风",
                has_office=False,
                parking="地面停车位3个",
                loading_platform=True,
                images="[]",
                status="available",
                is_published=True,
            ),
            Space(
                name="综合厂房A区",
                area=350.0,
                area_category="medium",
                monthly_rent=28000.0,
                yearly_rent=302400.0,
                address="广东省广州市黄埔区开发大道128号C栋1层",
                description="350㎡综合厂房，空间开阔，可灵活分割。适合中型设备组装、食品加工、纺织服装等各类生产制造。",
                floor_height=6.0,
                ground_load=1200.0,
                power_capacity=80,
                has_crane=False,
                has_forklift=True,
                floor_material="金刚砂地坪",
                fire_rating="丙类",
                drainage="地漏排水+明沟",
                ventilation="机械通风",
                has_office=True,
                parking="地面停车位4个",
                loading_platform=True,
                images="[]",
                status="available",
                is_published=True,
            ),
            Space(
                name="综合厂房B区",
                area=480.0,
                area_category="medium",
                monthly_rent=38400.0,
                yearly_rent=414720.0,
                address="广东省广州市黄埔区开发大道128号C栋2层",
                description="480㎡综合厂房，配备5吨行车，适合中型机械设备组装、模具加工、金属构件生产等。配套办公室及员工休息区。",
                floor_height=6.5,
                ground_load=1500.0,
                power_capacity=100,
                has_crane=True,
                has_forklift=True,
                floor_material="耐磨地坪",
                fire_rating="丙类",
                drainage="地漏排水+明沟",
                ventilation="机械通风+排风扇",
                has_office=True,
                parking="地面停车位5个",
                loading_platform=True,
                images="[]",
                status="available",
                is_published=True,
            ),
            # ── Large (>500㎡) ──────────────────────────────────────────
            Space(
                name="1号重型装配车间",
                area=600.0,
                area_category="large",
                monthly_rent=54000.0,
                yearly_rent=583200.0,
                address="广东省广州市黄埔区开发大道128号D栋1层",
                description="600㎡重型装配车间，层高8米，配备10吨行车。适合大型设备装配、钢结构加工、重型机械制造等重工业生产。",
                floor_height=8.0,
                ground_load=2000.0,
                power_capacity=150,
                has_crane=True,
                has_forklift=True,
                floor_material="耐磨地坪",
                fire_rating="乙类",
                drainage="明沟排水",
                ventilation="机械通风+屋顶风机",
                has_office=True,
                parking="地面停车位6个",
                loading_platform=True,
                images="[]",
                status="available",
                is_published=True,
            ),
            Space(
                name="2号物流中转仓",
                area=850.0,
                area_category="large",
                monthly_rent=68000.0,
                yearly_rent=734400.0,
                address="广东省广州市黄埔区开发大道128号D栋2层",
                description="850㎡物流中转仓库，层高9米，配备升降平台和宽幅出货门。适合大宗货物仓储、区域物流分拨、电商仓储配送等。",
                floor_height=9.0,
                ground_load=2500.0,
                power_capacity=80,
                has_crane=False,
                has_forklift=True,
                floor_material="水泥地坪",
                fire_rating="丙类",
                drainage="明沟排水",
                ventilation="自然通风+机械辅助",
                has_office=False,
                parking="地面停车位8个",
                loading_platform=True,
                images="[]",
                status="available",
                is_published=True,
            ),
            Space(
                name="3号大型钢结构厂房",
                area=1200.0,
                area_category="large",
                monthly_rent=96000.0,
                yearly_rent=1036800.0,
                address="广东省广州市黄埔区开发大道128号E栋",
                description="1200㎡大型钢结构厂房，独立园区，可进出大型货车。适合重型设备制造、船舶配件加工、大型仓储物流等。配套独立变压器。",
                floor_height=10.0,
                ground_load=3000.0,
                power_capacity=200,
                has_crane=True,
                has_forklift=True,
                floor_material="环氧地坪",
                fire_rating="乙类",
                drainage="明沟排水+集水井",
                ventilation="屋顶自然通风器",
                has_office=True,
                parking="地面停车位10个",
                loading_platform=True,
                images="[]",
                status="available",
                is_published=True,
            ),
        ]

        db.add_all(spaces)
        db.commit()
        print(f"[OK] Created {len(spaces)} sample factory spaces.")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
